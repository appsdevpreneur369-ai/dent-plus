import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import { checkReferences, parseAll, parseFile, FILES, type RawContent } from '@/lib/content/load';
import { ClinicSchema, DoctorSchema } from '@/lib/content/schemas';

const dir = path.join(__dirname, '..', 'content');
const raw = Object.fromEntries(Object.keys(FILES).map((f) => [f, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))])) as RawContent;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const md = (sub: string) => fs.readdirSync(path.join(dir, sub)).map((f) => ({ f, ...matter(fs.readFileSync(path.join(dir, sub, f), 'utf8')) }));

describe('content schema', () => {
  it('every content file parses and all cross-references resolve', () => {
    expect(() => parseAll(raw)).not.toThrow();
  });

  it('a bad field fails with the file and field named', () => {
    const bad = clone(raw) as Record<string, any>;
    bad['clinic.json'].hours.days[0].sessions[0].opens = '9.30';
    expect(() => parseAll(bad as RawContent)).toThrow(/clinic\.json: hours\.days\.0\.sessions\.0\.opens/);
  });

  it('a doctor placed in a department they do not list is caught', () => {
    const bad = clone(raw) as Record<string, any>;
    bad['departments.json'].departments.find((d: { id: string }) => d.id === 'eyes').doctors.push('deepthi');
    expect(() => parseAll(bad as RawContent)).toThrow(/departments\.json eyes: doctor "deepthi" does not list this department/);
  });

  it('a concern routed to a treatment in another department is caught', () => {
    const bad = clone(raw) as Record<string, any>;
    bad['routing.json'].problems[0].category = 'eye-care';
    expect(() => parseAll(bad as RawContent)).toThrow(/routing\.json missing-teeth/);
  });

  it('the clinic facts match the owner’s data (27 Oct 2026)', () => {
    const c = parseFile('clinic.json', ClinicSchema, raw['clinic.json']);
    expect(c.name.value).toBe('Dent Plus Multi Speciality Dental & Family Clinic');
    expect(c.slug).toBe('dent-plus-dental-family-clinic');
    expect(c.address.postalCode).toBe('522007');
    expect(c.phone.e164).toBe('+919440919770');
    expect(c.phoneAlt?.e164).toBe('+919247591847');
    expect(c.whatsapp).toMatchObject({ status: 'approved', e164: '+919440919770' });
    expect(c.email.status).toBe('placeholder');
    const mon = c.hours.days.find((d) => d.day === 'monday')!;
    expect(mon.sessions).toEqual([{ opens: '09:30', closes: '21:00' }]);
    expect(c.hours.days.find((d) => d.day === 'sunday')!.sessions).toEqual([]);
  });

  it('the four doctors, their degrees as confirmed, and no invented numbers', () => {
    const docs = raw['doctors.json'] as { doctors: any[] };
    const q = Object.fromEntries(docs.doctors.map((d) => [d.id, d.qualification]));
    expect(q).toEqual({ 'phani-krishna': 'MDS (SRM); FICOI (USA)', deepthi: 'MDS (OSM)', 'venugopal-rao': 'MBBS, Senior Resident (Paediatrics)', 'padmaja-rani': 'MBBS, D.O.' });
    expect(docs.doctors.filter((d) => d.isHead).map((d) => d.id)).toEqual(['phani-krishna']);
    for (const d of docs.doctors) {
      expect(d.registrationNumber).toBe('');
      expect(d.experienceYears).toBeNull();
    }
  });

  it('registration number: empty until confirmed, never the PENDING marker, accepts a real number', () => {
    const d = (raw['doctors.json'] as { doctors: any[] }).doctors[0];
    expect(DoctorSchema.safeParse({ ...d, registrationNumber: 'PENDING-VERIFICATION-X' }).success).toBe(false);
    expect(DoctorSchema.safeParse({ ...d, registrationNumber: 'A-12345' }).success).toBe(true);
  });

  it('no stock photos: every image is the clinic’s own; the stock-model banners are never used', () => {
    const imgs = (raw['images.json'] as { images: Record<string, { src: string; credit?: string }> }).images;
    for (const img of Object.values(imgs)) expect(img.credit).toBeUndefined();
    const all = JSON.stringify(raw);
    expect(all).not.toMatch(/dent-plus-banner/);
    expect(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'build-photos.mjs'), 'utf8')).not.toMatch(/src: 'dent-plus-banner/);
  });

  it('articles: four, all awaiting doctor review, frontmatter valid, real text', () => {
    const arts = md('education');
    expect(arts).toHaveLength(4);
    for (const a of arts) {
      expect(a.data.reviewStatus).toBe('pending');
      expect(`${a.data.slug}.md`).toBe(a.f);
      expect(a.content.split(/\s+/).length).toBeGreaterThan(300);
    }
    expect(checkReferences(parseAll(raw), arts.map((a) => ({ slug: a.data.slug, image: a.data.image, reviewedBy: a.data.reviewedBy })))).toEqual([]);
  });

  it('four legal drafts; privacy names the DPDP Act 2023', () => {
    const legal = md('legal');
    expect(legal.map((l) => l.data.slug).sort()).toEqual(['cookies', 'disclaimer', 'privacy', 'terms']);
    for (const l of legal) expect(l.data.draft).toBe(true);
    expect(legal.find((l) => l.data.slug === 'privacy')!.content).toMatch(/Digital Personal Data Protection Act, 2023/);
  });

  it('no content mentions another ClinicFlow247 clinic (tenant isolation)', () => {
    const all = [JSON.stringify(raw), ...md('education').map((a) => a.content), ...md('legal').map((a) => a.content)].join('\n');
    expect(all).not.toMatch(/Aishwarya|Parvathi|Sindhu|Suhasini|WalkWell|SMSDC|SPDC/i);
  });

  it('never publishes prices, invented stats or guarantee claims', () => {
    const all = [JSON.stringify(raw), ...md('education').map((a) => a.content)].join('\n');
    expect(all).not.toMatch(/₹|Rs\.?\s?\d|INR\s?\d/);
    expect(all).not.toMatch(/\d+\+?\s*(happy )?(patients|smiles|years of experience)/i);
    expect(all).not.toMatch(/\b(guarantee[ds]?|100% success|painless|permanent cure|cures?)\b/i);
  });

  it('medical departments carry a general-information caution', () => {
    const depts = (raw['departments.json'] as { departments: { id: string; caution?: string }[] }).departments;
    for (const id of ['family', 'children', 'eyes']) expect(depts.find((d) => d.id === id)!.caution).toMatch(/General information/);
  });
});
