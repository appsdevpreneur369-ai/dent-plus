// Validated site content. Server-only: client components receive resolved props, never this module.
import 'server-only';
import about from '@content/about.json';
import booking from '@content/booking.json';
import brand from '@content/brand.json';
import clinic from '@content/clinic.json';
import departments from '@content/departments.json';
import doctors from '@content/doctors.json';
import emergency from '@content/emergency.json';
import faqs from '@content/faqs.json';
import gallery from '@content/gallery.json';
import home from '@content/home.json';
import images from '@content/images.json';
import navigation from '@content/navigation.json';
import pages from '@content/pages.json';
import plan from '@content/plan.json';
import portal from '@content/portal.json';
import routing from '@content/routing.json';
import services from '@content/services.json';
import social from '@content/social.json';
import { checkReferences, ContentError, parseAll } from './load';
import { articles } from './markdown';

const content = parseAll({
  'clinic.json': clinic, 'brand.json': brand, 'plan.json': plan, 'portal.json': portal, 'social.json': social,
  'departments.json': departments, 'doctors.json': doctors, 'services.json': services, 'routing.json': routing, 'booking.json': booking,
  'home.json': home, 'about.json': about, 'faqs.json': faqs, 'emergency.json': emergency, 'gallery.json': gallery,
  'images.json': images, 'navigation.json': navigation, 'pages.json': pages,
});
const articleProblems = checkReferences(content, articles.map((a) => a.meta));
if (articleProblems.length) throw new ContentError('education', articleProblems.join('; '));

export const siteClinic = content['clinic.json'];
export const siteBrand = content['brand.json'];
export const sitePlan = content['plan.json'].plan;
export const sitePortal = content['portal.json'];
export const siteSocial = content['social.json'];
export const siteDepartments = content['departments.json'].departments;
export const doctorsFile = content['doctors.json'];
export const siteDoctors = doctorsFile.doctors;
export const siteServices = content['services.json'];
export const categories = siteServices.categories;
export const siteRouting = content['routing.json'];
export const siteBooking = content['booking.json'];
export const siteHome = content['home.json'];
export const siteAbout = content['about.json'];
export const siteFaqs = content['faqs.json'];
export const siteEmergency = content['emergency.json'];
export const siteGallery = content['gallery.json'];
export const siteImages = content['images.json'];
export const siteNav = content['navigation.json'];
export const sitePages = content['pages.json'];
export { articles, legalPages, getArticle, getLegal } from './markdown';

export const getDoctor = (slug: string) => siteDoctors.find((d) => d.slug === slug);
export const getDoctorById = (id: string) => siteDoctors.find((d) => d.id === id);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getDepartment = (id: string) => siteDepartments.find((d) => d.id === id);
export const doctorsInDepartment = (id: string) => siteDoctors.filter((d) => d.departments.includes(id as never));
export const categoriesInDepartment = (id: string) => categories.filter((c) => c.department === id);
export const headDoctor = siteDoctors.find((d) => d.isHead) ?? siteDoctors[0];

export function getImage(id: string) {
  const img = siteImages.images[id];
  if (!img) throw new ContentError('images.json', `unknown image id "${id}"`);
  return img;
}
