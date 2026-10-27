// Google reviews for the site: live from the Google Places API (New) when configured, else the hand-copied values in
// content/clinic.json → google. Server-only: the API key never reaches the browser.
//   GOOGLE_PLACES_API_KEY  server env (Cloud Run env / secret), never NEXT_PUBLIC_*
//   placeId                content/clinic.json → google.placeId (or GOOGLE_PLACE_ID env)
// Fetched during the page request (Cloud Run gives CPU only while a request is open: a background ISR refresh timed out,
// 26 Oct 2026) and cached for a day with unstable_cache. A failed call is NOT cached: the page shows the content values
// and the next request tries again.
// Places API terms: show the reviewer's name and the relative time as Google gives them, and attribute Google.
import 'server-only';
import { unstable_cache } from 'next/cache';
import { siteClinic } from './content';

export type GoogleReview = { author: string; rating: number; text: string; when: string; authorUrl?: string };
export type GoogleReviews = { rating: number | null; count: number; url: string; reviews: GoogleReview[]; live: boolean; checkedOn: string };

type PlacesResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: { rating?: number; relativePublishTimeDescription?: string; text?: { text?: string }; authorAttribution?: { displayName?: string; uri?: string } }[];
};

export async function getGoogleReviews(): Promise<GoogleReviews | null> {
  const g = siteClinic.google;
  if (!g) return null;
  const fallback: GoogleReviews = { rating: g.rating, count: g.reviewCount, url: g.url, reviews: g.reviews, live: false, checkedOn: g.checkedOn };
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || g.placeId;
  if (!key || !placeId) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') console.warn(`[google-reviews] fallback: ${!key ? 'GOOGLE_PLACES_API_KEY not set' : 'no placeId'}`);
    return fallback;
  }
  try {
    const live = await fetchPlace(placeId);
    return {
      rating: live.rating ?? g.rating,
      count: live.count ?? g.reviewCount,
      url: live.url ?? g.url,
      reviews: live.reviews.length ? live.reviews : g.reviews,
      live: true,
      checkedOn: live.checkedOn,
    };
  } catch (e) {
    console.warn(`[google-reviews] fallback: ${e instanceof Error ? e.message : String(e)}`);
    return fallback;
  }
}

/** One Places API call, cached for a day per place. Throws on any failure so a fallback is never cached. */
const fetchPlace = unstable_cache(
  async (placeId: string) => {
    // The key is read here, not passed in: unstable_cache derives its cache key from the arguments.
    const key = process.env.GOOGLE_PLACES_API_KEY ?? '';
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews' },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`Places API HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const p = (await res.json()) as PlacesResponse;
    return {
      rating: p.rating ?? null,
      count: p.userRatingCount ?? null,
      url: p.googleMapsUri ?? null,
      reviews: (p.reviews ?? [])
        .filter((r) => r.text?.text && r.authorAttribution?.displayName && r.rating)
        .map((r) => ({ author: r.authorAttribution!.displayName!, rating: r.rating!, text: r.text!.text!, when: r.relativePublishTimeDescription ?? '', authorUrl: r.authorAttribution?.uri })),
      checkedOn: new Date().toISOString().slice(0, 10),
    };
  },
  ['google-places-reviews'],
  { revalidate: 86400 },
);
