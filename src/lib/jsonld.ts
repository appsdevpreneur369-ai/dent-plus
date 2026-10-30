// schema.org JSON-LD builders. Placeholder contact data (phone/email) is never emitted.
import 'server-only';
import { getImage, headDoctor, siteClinic, siteDepartments, siteImages, siteSocial } from './content';
import type { Category, Doctor } from './content/schemas';
import { channels, directionsHref, mapsApproximate } from './links';
import { groupDays, SCHEMA_DAY } from './hours';
import { absoluteUrl } from './site';
import { fill } from './vars';

export const clinicLdId = () => `${absoluteUrl('/')}#clinic`;

const a = siteClinic.address;
const postalAddress = () => ({
  '@type': 'PostalAddress',
  streetAddress: [a.doorNumber, a.street].filter(Boolean).join(', '),
  addressLocality: a.locality,
  addressRegion: a.region,
  ...(a.postalCode ? { postalCode: a.postalCode } : {}),
  addressCountry: a.country,
});

export function openingHoursSpecification() {
  return groupDays(siteClinic.hours.days)
    .filter((g) => g.sessions.length)
    .flatMap((g) => g.sessions.map((s) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: g.days.map((d) => SCHEMA_DAY[d]), opens: s.opens, closes: s.closes })));
}

const SPECIALTY = (name: string) => `https://schema.org/${name}`;
/** schema.org type and specialty per department: the dental side is a Dentist, the medical sides are Physician practices. */
const DEPARTMENT_LD: Record<string, { type: string; specialty: string[] }> = {
  dental: { type: 'Dentist', specialty: ['Dentistry'] },
  family: { type: 'Physician', specialty: ['PrimaryCare'] },
  children: { type: 'Physician', specialty: ['Pediatric'] },
  eyes: { type: 'Physician', specialty: ['PrimaryCare'] },
};

/** MedicalClinic + Dentist (multi-type) for the clinic, with one department entry per department. */
export function clinicJsonLd() {
  const sameAs = siteSocial.links.map((l) => l.url).filter(Boolean);
  const logo = siteImages.logo.mark;
  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalClinic', 'Dentist'],
    '@id': clinicLdId(),
    name: siteClinic.name.value,
    alternateName: siteClinic.shortName,
    description: siteClinic.description.value,
    url: absoluteUrl('/'),
    logo: { '@type': 'ImageObject', url: absoluteUrl(logo.src), width: logo.width, height: logo.height },
    // The clinic's own photos (images/, supplied by the owner).
    image: ['clinic-name-board', 'treatment-in-progress', 'clinic-operatory', 'og'].map((id) => absoluteUrl(getImage(id).src)),
    ...(channels.call ? { telephone: channels.call.href.slice(4) } : {}),
    ...(channels.email ? { email: channels.email.display } : {}),
    address: postalAddress(),
    ...(siteClinic.maps.geo ? { geo: { '@type': 'GeoCoordinates', latitude: siteClinic.maps.geo.lat, longitude: siteClinic.maps.geo.lng } } : {}),
    ...(!mapsApproximate ? { hasMap: directionsHref } : {}),
    openingHoursSpecification: openingHoursSpecification(),
    areaServed: siteClinic.areaServed.places.map((name) => ({ '@type': 'City', name })),
    medicalSpecialty: [...new Set(siteDepartments.flatMap((d) => DEPARTMENT_LD[d.id].specialty))].map(SPECIALTY),
    isAcceptingNewPatients: true,
    department: siteDepartments.map((d) => ({
      '@type': DEPARTMENT_LD[d.id].type,
      '@id': `${absoluteUrl(`/departments/${d.id}`)}#department`,
      name: `${siteClinic.shortName}: ${d.title}`,
      url: absoluteUrl(`/departments/${d.id}`),
      medicalSpecialty: DEPARTMENT_LD[d.id].specialty.map(SPECIALTY),
      address: postalAddress(),
      ...(channels.call ? { telephone: channels.call.href.slice(4) } : {}),
      openingHoursSpecification: openingHoursSpecification(),
    })),
    founder: { '@id': physicianLdId(headDoctor) },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export const physicianLdId = (d: Doctor) => `${absoluteUrl(`/doctors/${d.slug}`)}#physician`;

/** IndividualPhysician — schema.org's Physician type for one doctor — linked to the clinic by practicesAt. */
export function physicianJsonLd(d: Doctor) {
  return {
    '@context': 'https://schema.org',
    '@type': 'IndividualPhysician',
    '@id': physicianLdId(d),
    name: d.displayName,
    url: absoluteUrl(`/doctors/${d.slug}`),
    description: `${d.qualification}, ${d.specialty}. ${d.summary}`,
    ...(d.photo ? { image: absoluteUrl(getImage(d.photo).src) } : {}),
    ...(d.schemaSpecialties.length ? { medicalSpecialty: d.schemaSpecialties.map(SPECIALTY) } : {}),
    knowsAbout: d.focus,
    hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: 'degree', name: d.qualification },
    // The clinic and the department(s) the doctor belongs to (all MedicalOrganizations).
    practicesAt: [{ '@id': clinicLdId() }, ...d.departments.map((id) => ({ '@id': `${absoluteUrl(`/departments/${id}`)}#department` }))],
    address: postalAddress(),
    ...(channels.call ? { telephone: channels.call.href.slice(4) } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: fill(f.q), acceptedAnswer: { '@type': 'Answer', text: fill(f.a) } })),
  };
}

/** Treatment category page: MedicalWebPage about a set of MedicalProcedures. */
export function treatmentJsonLd(c: Category, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: c.title,
    description: c.seo.description,
    inLanguage: 'en-IN',
    isPartOf: { '@type': 'WebSite', url: absoluteUrl('/'), name: siteClinic.name.value },
    publisher: { '@id': clinicLdId() },
    about: c.subTreatments.map((s) => ({ '@type': 'MedicalProcedure', name: s.title, description: s.summary })),
  };
}

/** Patient-education article: MedicalWebPage + Article facets. */
export function articleJsonLd(input: { path: string; title: string; description: string; datePublished: string; image: string; reviewer?: Doctor; wordCount: number }) {
  const img = getImage(input.image);
  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalWebPage', 'Article'],
    '@id': `${absoluteUrl(input.path)}#article`,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    headline: input.title,
    name: input.title,
    description: input.description,
    inLanguage: 'en-IN',
    datePublished: input.datePublished,
    dateModified: input.datePublished,
    wordCount: input.wordCount,
    image: { '@type': 'ImageObject', url: absoluteUrl(img.src), width: img.width, height: img.height, caption: img.alt },
    author: { '@id': clinicLdId() },
    publisher: { '@id': clinicLdId() },
    audience: { '@type': 'Patient' },
  };
}

export function galleryJsonLd(path: string, items: { src: string; width: number; height: number; caption: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    url: absoluteUrl(path),
    name: `${siteClinic.name.value} — Our clinic`,
    about: { '@id': clinicLdId() },
    image: items.map((i) => ({
      '@type': 'ImageObject',
      contentUrl: absoluteUrl(i.src),
      width: i.width,
      height: i.height,
      caption: i.caption,
      creditText: siteClinic.name.value,
      copyrightNotice: siteClinic.name.value,
    })),
  };
}
