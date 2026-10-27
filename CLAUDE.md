# CLAUDE.md — Dent Plus Multi Speciality Dental & Family Clinic website (DPC)

Public website for **Dent Plus Multi Speciality Dental & Family Clinic**, D.No 5-72-31/3, Ashok Nagar 3rd Lane, opp. Siti Cable Office, BSNL Office Road, Lakshmipuram, Guntur 522007, Andhra Pradesh (project code **DPC**, ClinicFlow slug `dent-plus-dental-family-clinic`). Lead doctor **Dr. G. Phani Krishna, MDS (SRM); FICOI (USA)**, Prosthodontist & Implantologist. Built from 27 Oct 2026 as a **sales demo for Thursday 29 Oct 2026**: it shows the clinic how ClinicFlow247 runs their website, booking and post-visit automation. ClinicFlow247 **ENTERPRISE (white-label)**.

**Delivery model: website + core tenant**, same as `D:\AISHWARYA` (which copied `D:\SPDC`). This repo is the public site plus the generated tenant file `tenant/dent-plus-dental-family-clinic.json`. Every role and workflow comes from ClinicFlow core, branded by data (theme tokens, logo, favicon, appTitle) on the **shared** portal app: no separate tenant app or Cloud Run service. **Never fork core** (`D:\ClinicFlow\CLAUDE.md` forbids per-tenant codebases and tenant-identity conditionals).

**What makes it different from the other clinic sites:** it is **multi-speciality**. Four departments: Dental (prosthodontics & implants lead), Family medicine, Paediatrics (children), Eye care. Every doctor maps to a department; booking starts by department or by doctor.

Status (27 Oct 2026, night): **site built and checked locally** (45 pages; `npm run check` green). Logo SVG approved by the owner. Repo https://github.com/appsdevpreneur369-ai/dent-plus (`main`, public: raw patient photos and stock-model banners are git-ignored). **Website on staging** (`dpc-frontend-staging-00001-pqt`); staging API CORS includes it (`00109-tgx`). **Clinic onboarded on staging** (27 Oct, owner ran setup-staging.py twice): clinic `9692c5b1-c024-4f48-a248-afa6d022eb3d`, ACTIVE, ENTERPRISE, branch `3f8a1ccf-…`, dental suite ON, logo + favicon, review link = Google *search* stand-in (`--demo-review-link`), 4 doctors with 15-min slots Mon–Sat 09:30–21:00 (Phani Krishna `89525fef-…`, Deepthi `e1507a60-…`, Venugopal Rao `10c8faff-…`, Padmaja Rani `21317f18-…`). First run left Dr. Phani Krishna out: `DOCTOR_LICENSE_ALREADY_EXISTS` (placeholder `PENDING-VERIFICATION-PHANI` was taken by another staging clinic) → placeholders are now `PENDING-VERIFICATION-DPC-<NAME>` (the three first-run doctors keep the old placeholders on staging). Demo seed: Lakshmi / Arjun / Saroja Demo (dental / child / eyes); SQL phases A and B run with `scripts/staging/run-demo-sql.py` (credentials from Secret Manager, never printed). Booking e2e on staging **9/9**; its 3 "Test Patient" bookings on Thu 29 Oct are kept on purpose (owner). Open items: `PENDING_ITEMS.md`. Demo runbook: `docs/DEMO_RUNBOOK.md`.

### Local QA (27 Oct 2026)
| Check | Result |
| --- | --- |
| `npm run check` (lint, tsc, 59 unit tests, contrast, build, originality) | ✅ all green |
| Originality, 8-word window vs AISHWARYA / SPDC / DR-SINDHU / SMSDC (content + built HTML + UI source) | ✅ 0 repeats (28 common phrasings reworded on the way) |
| Contrast (`npm run contrast`) | ✅ AA; sky on white is decoration only, focus ring = primary (sky only on navy) |
| Screenshots 360/768/1280, 16 pages (`qa/screens`) | ✅ 0 horizontal overflow, 1 H1 per page |
| Keyboard + reduced motion (`scripts/qa/a11y-keyboard.mjs`) | ✅ 10/10 |
| JSON-LD (`scripts/qa/seo-audit.mjs`, local schema.org vocab) | ✅ 0 errors on 36 pages (MedicalClinic+Dentist, Dentist/Physician departments, IndividualPhysician ×4, MedicalWebPage, FAQPage, Article) |
| Lighthouse home (local) | mobile P92 A100 BP100 · desktop P100 A100 BP100 (SEO 69 = noindex on non-production, by design) |
| Other clinics' names in build output | ✅ none |
| Booking e2e (`scripts/qa/e2e-booking.mjs`, 9 checks) | ✅ **9/9 on staging** (27 Oct): paediatrician via hero card, dentist with doctor step, eye doctor from her page, email-taken message, no popup, enquiry + WhatsApp fallbacks, 2 deep links |
| Side-by-side with AISHWARYA home | `docs/screenshots/compare-aishwarya-1280.jpg`, `-360.jpg` |

## Hard rules

- **Ask the owner first** before: pushing to GitHub, running anything against the staging API (onboarding, demo seed, CORS), any deploy, any Google Cloud change (API keys, min-instances). **Never production.**
- **Another session may be deploying core to staging.** Before any step that touches the shared staging API, tell the owner and wait for the go. Check `gcloud builds list --ongoing` and the latest `clinicflow-api-staging` revision first. CORS changes: `--update-env-vars` only, keep every existing origin.
- **Read-only:** `D:\ClinicFlow`, `D:\AISHWARYA`, `D:\SPDC`, `D:\DR-SINDHU`, `D:\SMSDC`. Core bugs go in `PENDING_ITEMS.md` → "Core", never patched here.
- **Never invent** phone, email, registration numbers, experience years, awards, patient counts, ratings, reviews, prices, success rates, before/after results. Missing = `status: placeholder` (Draft badge). Initials avatar until a real doctor photo.
- **Medical wording stays cautious** ("may help", "your doctor will advise"). No cure or guarantee claims (Drugs & Magic Remedies Act, NMC/IMC, ASCI). Paediatrics and eye-care pages are general information only.
- **Copy is original:** written from scratch, different structure/headings/examples from AISHWARYA, SPDC, DR-SINDHU, SMSDC (same city: duplicate-content risk). `npm run originality` fails on any **8-word** run shared with those four projects' content or built HTML (part of `npm run check`).
- **Photos:** only the clinic's own (`images/`). **Never** `dent-plus-banner*.jpeg` as photos (stock model, no rights to her face); the model's poster also appears on the reception wall in `interior-main-entrance.jpeg` (crop it out). **Patients' eyes are blurred** (owner, 27 Oct). No red anywhere (the signboard's red heart/family mark is not used).
- **Booking never fakes success:** `clinicflow` → `enquiry` → `whatsapp` → "not available" + Call.
- **Plan gate:** `content/plan.json` = `enterprise`; `src/lib/plan.ts` stops the site promising features the plan lacks.
- Logins live only in `credentials/DEMO_LOGINS.local.md` (git-ignored), never in chat or docs.

## Facts and their source

From the account owner (27 Oct 2026) unless noted:
- Name, address, PIN **522007**.
- Hours **Mon–Sat 9:30 AM – 9:00 PM, continuous; Sunday closed** (owner's answer "9:00" to "continuous or split?"; directories show a split 10–1 / 5:30–9: not used on the site).
- Phones for calls **9440919770, 9247591847** (also printed on the signboard). **WhatsApp: 9440919770.**
- Taglines (clinic's own banners): "Your smile, our priority.", "Expert care in every step.", "Make your smile brighter with us."
- Doctors (credentials also printed on the night signboard, `exterior-name-board-main.jpeg`):
  1. **Dr. G. Phani Krishna** — MDS (SRM); FICOI (USA) (confirmed) — Prosthodontist & Implantologist — Professor, Sibar Institute of Dental Sciences. **Lead.** Dental.
  2. **Dr. B. Deepthi** — MDS (OSM) (confirmed as printed; abbreviation not expanded) — Consultant Prosthodontist & Implantologist. Dental. Photo: the owner allowed a photo of her treating a patient, if it is clear enough (patient's eyes blurred).
  3. **Dr. G. Venugopal Rao** — MBBS, Sr. Resident (Paediatrics) — Consultant Family Physician & Paediatrician. Children + Family.
  4. **Dr. T. Padmaja Rani** — MBBS, D.O. — Consultant Family Physician & Ophthalmologist. Eyes + Family.
- **Placeholders:** clinic email, Google Business listing, registration numbers, consultation fees, photos of the other three doctors, staff login emails, domain, social links.
- Staging slug check (27 Oct, read-only GET `/clinics/public/{slug}`): `dent-plus-dental-family-clinic` → **404 (free)**; control `aishwarya-dental-clinic` → 200.

## Stack and brand

Next.js 14.2 App Router, TypeScript strict, Tailwind, next/font, zod, vitest, lucide-react (same stack as AISHWARYA).

**Design direction: "family clinic, calm and premium"**: deep navy + confident blue, lots of white space, large editorial headings, crisp cards with 1px borders, soft sky-blue accent from the logo's "+". Must not resemble AISHWARYA (violet, Sora/Nunito Sans, full-width clinic-photo hero), SPDC (teal, Fraunces), DR-SINDHU (blue/green, Roboto/Montserrat) or SMSDC (Inter/Montserrat/Plus Jakarta).

| Token | Value | Use |
| --- | --- | --- |
| Primary blue | `#1E4D7D` (owner) | Buttons, links, white text on it |
| Dark navy | `#221F45` (owner) | Top bar, footer, dark bands, logo tile |
| Sky accent | ~`#3AA8E6` (from the logo "+"; final value set by `npm run contrast`) | Icons, chips, rules, "+" motif; as text only on navy |
| Warning | amber (no red) | Errors, Draft badges |
| Headings | **Outfit** | Geometric, rounded: echoes the rounded-square logo; strong at large editorial sizes |
| Body | **Figtree** | Tall x-height, very legible at 15–16 px on budget phones (older patients, parents) |

Home layout: split hero (clinic's own photo + "Book in 30 seconds" card) · department switcher (Dental / Family / Children / Eyes, filters doctors and services in place) · doctor strip with speciality chips · "Your visit, step by step" timeline · bento gallery of own photos · hours + map with live "Open now / Closed" badge · sticky mobile action bar (Call / Book / Directions). Header fixed height (no bounce on scroll). AA contrast, keyboard 10/10, reduced motion, 360/768/1280 with no horizontal scroll, Lighthouse mobile ≥ 90.

**Logo (approved 27 Oct 2026):** `brand/dent-plus-mark.svg`, redrawn from `images/logo.jpeg` (424 px photo of the signboard, blurred, tilted) redrawn as a clean SVG: navy rounded square, white tooth with a diagonal swoosh and implant thread, sky circle with a white "+". Straightened and sharpened only, not redesigned. Comparison: `docs/logo-compare.png`; icon sheet: `docs/icon-preview.png`. Header: mark + wordmark "Dent Plus" / "Dental & Family Clinic". Icons via the AISHWARYA generator approach (rounded tile, simplified 16 px, apple-icon full square, manifest 192/512/maskable, OG image).

## Commands (same as AISHWARYA)

| Command | What |
| --- | --- |
| `npm run dev` / `npm run build && npm start` | Dev / production |
| `npm run check` | lint + typecheck + tests + contrast + originality + build |
| `npm run brand` / `npm run images` | Logo, favicon, app icons and OG card from `brand/dent-plus-mark.svg` / WebP variants (images run before every build) |
| `npm run photos` | Clinic photos from `images/` → `public/images/photos` (crops, patients' eyes blurred; banners never used) |
| `node scripts/qa/icon-preview.mjs` | `docs/icon-preview.png` (favicon on light/dark tabs + app icons) |
| `node scripts/qa/a11y-keyboard.mjs <base>` | Keyboard, department tabs, dialog trap, reduced motion (10 checks) |
| `node scripts/qa/seo-audit.mjs <base> qa/schemaorg.jsonld` | Titles, canonicals, alt text, JSON-LD vs schema.org (local) |
| `node scripts/qa/compare-home.mjs <base> <other site> qa/compare` | Side-by-side of two home pages |
| `npm run tenant` | Regenerate `tenant/dent-plus-dental-family-clinic.json` from `/content` |
| `node scripts/qa/screens.mjs <base> qa/screens` | 360/768/1280 screenshots, overflow + tap-target report |
| `node scripts/qa/e2e-booking.mjs <base> qa/e2e` | Booking e2e, 9 checks (local or staging, never production; test phones 90000115xx) |
| `python scripts/staging/setup-staging.py --admin-email <sa> [--demo-review-link]` | **Owner's yes first.** Onboard on staging: import, ACTIVE, dental suite, logo/favicon, 4 doctors' slots + schedules, review link (stand-in with the flag) |
| `python scripts/staging/run-demo-sql.py qa/staging/post-visit-demo-phaseA.sql` (then `-phaseB.sql`, or `--status`) | **Owner's yes first.** Runs the seed's SQL on the staging DB (credentials from Secret Manager, never printed; only those two files, UPDATEs only, one transaction) |
| `python scripts/staging/seed-post-visit-demo.py --admin-email <sa> [--clicked]` | **Owner's yes first.** 3 demo patients, one per department (dental / child / eyes), at the thank-you / review request / reminder stages + 2 SQL files |

Local builds on this machine may need `NEXT_BUILD_CPUS=1` (low free RAM). In Git Bash, prefix scripts that take `/paths` with `MSYS_NO_PATHCONV=1`.

## Deployments

Same manual pattern as AISHWARYA: Cloud Build image, `gcloud run deploy`. Never touch other services, `clinicflow-lb`, certs or DNS. No wildcard DNS yet: portal subdomain later.

| Item | Value |
| --- | --- |
| GCP | project `sincere-stock-499113-f1`, region `asia-south1` |
| Image | `asia-south1-docker.pkg.dev/sincere-stock-499113-f1/clinicflow/dpc-frontend:<tag>` |
| Staging service | `dpc-frontend-staging`: 256Mi, 1 CPU, min-instances 0 (1 only during the meeting window), unauthenticated, port 3000 |
| Expected URL | https://dpc-frontend-staging-1071497363324.asia-south1.run.app |
| Build args | `NEXT_PUBLIC_SITE_ENV=staging`, `NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=true`, `NEXT_PUBLIC_NOINDEX=true`, `NEXT_PUBLIC_SITE_URL=<staging URL>`, `NEXT_PUBLIC_CLINICFLOW_API_URL=https://clinicflow-api-staging-1071497363324.asia-south1.run.app/api/v1`, `NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG=dent-plus-dental-family-clinic`, `NEXT_PUBLIC_BOOKING_OTP_HINT=123456`, `NEXT_PUBLIC_PORTAL_BASE_URL=https://clinicflow-frontend-staging-1071497363324.asia-south1.run.app` |
| Staging API CORS | Add the site origin to `APP_CORS_ALLOWEDORIGINS` of `clinicflow-api-staging` with `--update-env-vars` (keep every existing origin). |

History (staging):

| Date | Commit / image tag | Revision | Notes |
| --- | --- | --- | --- |
| 2026-10-27 | (ClinicFlow API, env only) | `clinicflow-api-staging-00109-tgx` | Owner's yes. `APP_CORS_ALLOWEDORIGINS` += DPC origin, the 8 existing origins kept (rollback `00108-s62`). Env diff vs `00108-s62` = CORS only (WhatsApp still dry-run). Verified DPC/ADC/SPDC allowed, unknown origin 403, no ERROR logs. **Note:** AISHWARYA's "WhatsApp ON" switch routes to `00107-tm8`, which lacks the DPC origin: for a WhatsApp demo re-apply the WhatsApp env vars on the latest revision instead. |
| 2026-10-27 | `9ea2428` | `dpc-frontend-staging-00001-pqt` | First deploy (Cloud Build `51e63003`), 256Mi, 1 CPU, min 0. 33 URLs 200, 404 page, `X-Robots-Tag: noindex` + robots Disallow + meta noindex, `/login` 307 to the staging portal clinic login, Draft badges on, no other clinic names, no ERROR logs. |

## Timeline

- **Tue 27 Oct (night):** content + design direction + logo SVG and comparison for the owner's review.
- **Wed 28 Oct:** site built; `npm run check` green; QA screenshots. Evening, **after the owner's yes**: staging onboarding, CORS, deploy, demo data, booking e2e.
- **Thu 29 Oct (morning):** checks only (`docs/DEMO_RUNBOOK.md`), then the demo.
