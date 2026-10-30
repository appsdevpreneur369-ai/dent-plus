// zod schemas for everything in /content. A bad edit fails the build with the file and field named.
import { z } from 'zod';

export const Status = z.enum(['approved', 'placeholder']);
export type Status = z.infer<typeof Status>;

import { DAYS } from '../days';
export { DAYS } from '../days';
export const Day = z.enum(DAYS);
export type Day = z.infer<typeof Day>;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be HH:mm (24h)');
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'colour must be #RRGGBB');
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lowercase-with-dashes');
const sitePath = z.string().regex(/^(\/[^\s]*|@portal:[a-zA-Z]+|@call|@whatsapp|https:\/\/\S+)$/, 'href must be /path, @portal:<key>, @call, @whatsapp or https://');
const Note = z.string().optional();

const Text = z.object({ value: z.string().min(1), status: Status });
const Contact = z.object({ status: Status, display: z.string().min(1), e164: z.string().min(1), _note: Note });
const Session = z.object({ opens: hhmm, closes: hhmm }).refine((s) => s.opens < s.closes, 'opens must be before closes');

export const ClinicSchema = z.object({
  _note: Note,
  name: Text,
  shortName: z.string().min(1),
  slug,
  tagline: Text,
  description: Text,
  address: z.object({
    status: Status,
    _note: Note,
    doorNumber: z.string(),
    street: z.string().min(1),
    landmark: z.string(),
    locality: z.string().min(1),
    district: z.string(),
    region: z.string().min(1),
    postalCode: z.string().regex(/^(\d{6})?$/, 'PIN must be 6 digits or empty'),
    country: z.string().length(2),
    countryName: z.string(),
  }),
  phone: Contact,
  /** Second appointment line (optional). */
  phoneAlt: Contact.optional(),
  whatsapp: Contact,
  email: z
    .object({ status: Status, value: z.string().min(1) })
    .refine((e) => e.status !== 'approved' || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e.value), { message: 'an approved email must be a real address', path: ['value'] }),
  timezone: z.string().min(1),
  hours: z.object({
    _note: Note,
    status: Status,
    sessionsStatus: Status,
    daysStatus: Status,
    days: z
      .array(z.object({ day: Day, sessions: z.array(Session) }))
      .length(7)
      .refine((d) => new Set(d.map((x) => x.day)).size === 7, 'each weekday exactly once'),
  }),
  maps: z.object({
    status: Status,
    _note: Note,
    query: z.string().min(1),
    shareUrl: z.union([z.literal(''), z.string().url()]),
    embedUrl: z.union([z.literal(''), z.string().url()]),
    geo: z.object({ lat: z.number(), lng: z.number() }).nullable(),
    /** Landmark-based directions shown on /contact. */
    wayfinding: z.array(z.object({ icon: z.string(), text: z.string().min(1) })),
  }),
  areaServed: z.object({ status: Status, places: z.array(z.string().min(1)) }),
  /** Google "write a review" link for ClinicFlow's review request. Approved only as a real write-review URL. */
  googleReview: z
    .object({
      status: Status,
      _note: Note,
      writeReviewUrl: z.union([z.literal(''), z.string().url()]),
      stagingDemoUrl: z.union([z.literal(''), z.string().url().startsWith('https://www.google.')]),
    })
    .refine(
      (g) => g.status !== 'approved' || /^https:\/\/(search\.google\.com\/local\/writereview\?placeid=[\w-]+|g\.page\/r\/[\w-]+\/review)$/.test(g.writeReviewUrl),
      { message: 'an approved review link must be https://search.google.com/local/writereview?placeid=… or https://g.page/r/…/review', path: ['writeReviewUrl'] },
    ),
  /**
   * Public Google reviews, hand-copied with a date (or fetched live from the Places API when a key is configured,
   * src/lib/google-reviews.ts). Displayed with Google attribution only; never emitted as aggregateRating JSON-LD.
   * rating stays null until someone copies the real figure; reviews are verbatim quotes with the reviewer's name.
   */
  google: z
    .object({
      status: Status,
      _note: Note,
      rating: z.number().min(1).max(5).nullable(),
      reviewCount: z.number().int().nonnegative(),
      checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      url: z.string().url().regex(/^https:\/\/(www|maps)\.google\.com\//, 'must be a Google (www/maps.google.com) link'),
      placeId: z.string(),
      reviewTopics: z.array(z.string()),
      reviews: z.array(z.object({ author: z.string().min(1), rating: z.number().int().min(1).max(5), text: z.string().min(1), when: z.string().min(1) })),
    })
    .optional(),
});

export const BrandSchema = z.object({
  status: Status,
  _note: Note,
  colors: z.object({
    primary: hex, primaryHover: hex, primaryDeep: hex, navy: hex, navySoft: hex, sky: hex, skyOnDark: hex, skySoft: hex, tint: hex,
    background: hex, surface: hex, surfaceAlt: hex, text: hex, textSecondary: hex, border: hex, onDark: hex, onDarkMuted: hex,
    success: hex, successSoft: hex, warning: hex, warningText: hex, warningSoft: hex, whatsapp: hex,
    /** Status dots on navy (top info bar): decoration only, never text. */
    successOnDark: hex, warningOnDark: hex,
  }),
  fonts: z.object({ heading: z.string(), body: z.string() }),
  radius: z.string(),
  wordmark: z.object({ primary: z.string(), secondary: z.string() }),
});

export const PLANS = ['free', 'starter', 'pro', 'enterprise'] as const;
export const PlanSchema = z.object({ _note: Note, plan: z.enum(PLANS) });

export const PortalSchema = z.object({
  _note: Note,
  status: Status,
  portalBaseUrl: z.string().url(),
  clinicSlug: slug,
  enterprise: z.object({ _note: Note, subdomain: z.union([z.literal(''), slug]) }),
  paths: z.object({
    login: z.string(), register: z.string(), forgotPassword: z.string(),
    clinicPage: z.string(), bookingPage: z.string(), staffLogin: z.string(),
  }),
});

export const SocialSchema = z.object({
  _note: Note,
  status: Status,
  links: z.array(
    z.object({
      platform: z.enum(['instagram', 'youtube', 'x', 'linkedin', 'facebook']),
      label: z.string(),
      url: z.union([z.literal(''), z.string().url().startsWith('https://')]),
    }),
  ),
});

export const DEPARTMENTS = ['dental', 'family', 'children', 'eyes'] as const;
export const DepartmentId = z.enum(DEPARTMENTS);
export type DepartmentId = z.infer<typeof DepartmentId>;

export const DepartmentsSchema = z.object({
  _note: Note,
  status: Status,
  departments: z
    .array(
      z.object({
        id: DepartmentId,
        title: z.string().min(1),
        shortTitle: z.string().min(1),
        icon: z.string(),
        /** images.json id of the department's picture (cards on Treatments, Departments and the switcher). */
        image: z.string(),
        /** Gradient panel in the page header. Dental: the clinic's own wall banner (quote: true). Others fall back to `line`. */
        banner: z.object({ label: z.string(), text: z.string(), accent: z.string().optional(), quote: z.boolean().optional() }).optional(),
        /** One line under the tab in the department switcher. */
        line: z.string().min(1),
        summary: z.string().min(1),
        /** General-information note shown on the department (e.g. "general information only"). */
        caution: z.string().optional(),
        /** "Not sure / general visit" option for booking in this department. */
        generalLabel: z.string().min(1),
        doctors: z.array(slug).min(1),
      }),
    )
    .length(4),
});

const Consultation = z.object({ days: z.array(Day).min(1), opens: hhmm, closes: hhmm });

export const DoctorSchema = z.object({
  id: slug,
  status: Status,
  slug,
  previousSlugs: z.array(slug),
  firstName: z.string().min(1),
  lastName: z.string(),
  displayName: z.string().min(1),
  initials: z.string().min(1).max(3),
  qualification: z.string().min(1),
  specialty: z.string().min(1),
  /** Primary department first; a doctor may serve more than one (e.g. family physician + paediatrician). */
  departments: z.array(DepartmentId).min(1),
  /** schema.org MedicalSpecialty names (e.g. Dentistry, PrimaryCare, Pediatric). */
  schemaSpecialties: z.array(z.string().min(1)),
  /** Which council registers this doctor (shown with the registration number). */
  council: z.enum(['dental', 'medical']),
  chips: z.array(z.string().min(1)).min(1),
  role: z.string(),
  isHead: z.boolean(),
  photo: z.string().nullable(),
  /** A second photo of the doctor (own photos only), shown on the profile page. */
  photoSecondary: z.string().nullable(),
  /** "" until confirmed (site shows "being confirmed"; the tenant file sends PENDING-VERIFICATION-<NAME>). */
  registrationNumber: z.string().regex(/^(?!.*PENDING)[A-Za-z0-9/ .-]*$/i, 'leave empty until confirmed, or the real council number'),
  clinicflowDoctorId: z.string().nullable(),
  summary: z.string().min(1),
  bio: z.array(z.string().min(1)).min(1),
  focus: z.array(z.string()),
  consultation: z.array(Consultation).min(1),
  consultationStatus: Status,
  /** Only from the account owner/clinic; null = not shown. */
  experienceYears: z.number().int().positive().nullable(),
  experienceStatus: Status,
});
export const DoctorsFileSchema = z.object({
  _note: Note,
  consultSlotMinutes: z.number().int().min(5).max(120),
  doctors: z.array(DoctorSchema).min(1),
});

const Faq = z.object({ q: z.string().min(1), a: z.string().min(1), home: z.boolean().optional() });

export const CategorySchema = z.object({
  slug,
  status: Status,
  department: DepartmentId,
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  icon: z.string(),
  size: z.enum(['lg', 'md', 'sm']),
  image: z.string().min(1),
  doctors: z.array(slug).min(1),
  confirmSpecialist: z.boolean(),
  short: z.string().min(1),
  intro: z.array(z.string()).min(1),
  steps: z.array(z.object({ title: z.string(), text: z.string() })),
  subTreatments: z
    .array(z.object({ slug, title: z.string(), summary: z.string(), visits: z.string(), doctors: z.array(slug).optional() }))
    .min(1),
  faqs: z.array(Faq),
  seo: z.object({ title: z.string().min(1).max(60), description: z.string().min(50).max(170) }),
});
export const ServicesSchema = z.object({ _note: Note, priceNote: z.string(), categories: z.array(CategorySchema).min(1) });

export const RoutingSchema = z.object({
  _note: Note,
  status: Status,
  /** Concern chips, per department (booking step 2 and the department switcher). */
  problems: z.array(z.object({ id: slug, department: DepartmentId, label: z.string(), icon: z.string(), doctors: z.array(slug).min(1), category: slug })),
});

const PopupSchema = z.object({
  _note: Note,
  enabled: z.boolean(),
  delaySeconds: z.number().min(1),
  oncePerSession: z.boolean(),
  showOnMobile: z.boolean(),
  excludedPaths: z.array(z.string().startsWith('/')),
});

export const BookingSchema = z.object({
  status: Status,
  _note: Note,
  mode: z.enum(['clinicflow', 'enquiry', 'whatsapp']),
  clinicflow: z.object({
    _note: Note,
    apiBaseUrl: z.union([z.literal(''), z.string().url()]),
    clinicSlug: z.union([z.literal(''), slug]),
    clinicId: z.string(),
  }),
  advanceDays: z.number().int().min(1).max(120),
  otpResendSeconds: z.number().int().min(10),
  allowDirectSpecialistBooking: z.boolean(),
  defaultDoctor: slug,
  popup: PopupSchema,
  consent: z.string().min(1),
  whatsappMessage: z.string(),
  enquiryMessage: z.string(),
  generalWhatsappMessage: z.string(),
  note: z.string(),
});

const Head = z.object({ eyebrow: z.string(), title: z.string(), lead: z.string().optional() });
const IconItem = z.object({ icon: z.string(), title: z.string(), text: z.string() });

export const HomeSchema = z.object({
  status: Status,
  hero: z.object({
    eyebrow: z.string(), title: z.string(), titleAccent: z.string(), lead: z.string(), image: z.string(),
    imageCaption: z.string(), points: z.array(z.string()).min(1),
    /** Under the doctor avatars. */
    teamLine: z.string(),
    quickBook: z.object({ title: z.string(), lead: z.string(), button: z.string(), note: z.string() }),
  }),
  departments: Head.extend({ servicesLabel: z.string(), doctorsLabel: z.string(), moreLabel: z.string() }),
  doctors: Head,
  visit: Head.extend({ note: z.string(), steps: z.array(IconItem.extend({ who: z.string() })).min(3) }),
  /** WhatsApp follow-up, shown as example messages in a phone (only when the plan includes WhatsApp reminders). */
  messages: Head.extend({
    phoneTitle: z.string(), phoneSubtitle: z.string(), note: z.string(),
    steps: z.array(z.object({ icon: z.string(), when: z.string(), title: z.string(), text: z.string(), action: z.string().optional(), time: z.string() })).min(2),
  }),
  promise: Head.extend({ items: z.array(IconItem).min(2) }),
  gallery: Head.extend({ tiles: z.array(z.object({ image: z.string(), caption: z.string() })).min(4) }),
  location: Head.extend({ image: z.string() }),
  education: Head,
  faq: Head,
  cta: z.object({ title: z.string(), lead: z.string(), button: z.string() }),
});

export const AboutSchema = z.object({
  status: Status,
  headerImage: z.string(),
  story: z.object({ title: z.string(), paragraphs: z.array(z.string()).min(1), image: z.string() }),
  values: z.object({ title: z.string(), items: z.array(IconItem) }),
  team: z.object({ title: z.string(), lead: z.string() }),
  platform: z.object({ title: z.string(), lead: z.string(), _note: Note }),
});

export const FaqsSchema = z.object({ _note: Note, status: Status, items: z.array(Faq).min(1) });

export const EmergencySchema = z.object({
  status: Status,
  title: z.string(),
  lead: z.string(),
  hospitalWarning: z.string(),
  situations: z.array(z.object({ department: DepartmentId, title: z.string(), steps: z.array(z.string()).min(1) })),
});

export const GallerySchema = z.object({
  _note: Note,
  status: Status,
  intro: z.string(),
  categories: z.array(z.string()),
  items: z.array(z.object({ image: z.string(), caption: z.string(), category: z.string() })),
});

const ImageRef = z.object({
  src: z.string().startsWith('/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1),
  status: Status,
  credit: z.string().optional(),
  /** CSS object-position focal point for cropped displays, e.g. "50% 18%" (keeps a face or signage in frame). */
  objectPosition: z.string().regex(/^\d{1,3}% \d{1,3}%$/).optional(),
  /** "contain" = never cropped (images with lettering); shown on `background` (sampled from the image's edges). */
  fit: z.enum(['cover', 'contain']).optional(),
  background: z.string().optional(),
});
export const ImagesSchema = z.object({
  _note: Note,
  logo: z.object({
    mark: ImageRef,
    /** Logo with the clinic name set in it. Optional: the header uses the mark + a text wordmark. */
    full: ImageRef.optional(),
    source: z.object({ src: z.string(), _note: Note }),
    sourceTitle: z.object({ src: z.string(), _note: Note }).optional(),
  }),
  images: z.record(z.string(), ImageRef),
});
export type ImageRef = z.infer<typeof ImageRef>;

const NavLink = z.object({ label: z.string(), href: sitePath });
export const NavigationSchema = z.object({
  header: z.array(NavLink),
  footer: z.array(z.object({ title: z.string(), links: z.array(NavLink) })),
});

const PageMeta = z.object({
  title: z.string().min(1),
  description: z.string().min(50).max(170),
  h1: z.string().optional(),
  intro: z.string().optional(),
  absoluteTitle: z.boolean().optional(),
});
export const PagesSchema = z.object({
  _note: Note,
  home: PageMeta, about: PageMeta, doctors: PageMeta, treatments: PageMeta, departments: PageMeta, gallery: PageMeta, education: PageMeta,
  faqs: PageMeta, book: PageMeta, contact: PageMeta, emergency: PageMeta, privacy: PageMeta, terms: PageMeta,
  disclaimer: PageMeta, cookies: PageMeta,
  notFound: z.object({ title: z.string(), h1: z.string(), intro: z.string() }),
});

export const ArticleFrontmatter = z.object({
  title: z.string().min(1),
  slug,
  description: z.string().min(50).max(170),
  category: z.string(),
  image: z.string(),
  datePublished: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewedBy: slug,
  reviewStatus: z.enum(['pending', 'reviewed']),
  status: Status,
  readingMinutes: z.number().int().positive(),
  featured: z.boolean(),
});
export const LegalFrontmatter = z.object({
  title: z.string(),
  slug,
  status: Status,
  draft: z.boolean(),
  lastUpdated: z.string(),
});

export type Clinic = z.infer<typeof ClinicSchema>;
export type Doctor = z.infer<typeof DoctorSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Department = z.infer<typeof DepartmentsSchema>['departments'][number];
export type Booking = z.infer<typeof BookingSchema>;
export type Portal = z.infer<typeof PortalSchema>;
export type PlanName = (typeof PLANS)[number];
