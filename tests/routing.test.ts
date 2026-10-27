import { describe, expect, it } from 'vitest';
import { doctorsForOption, findOption, optionsFor, resolvePrefill } from '@/lib/booking/treatments';
import { content, slugs, treatmentGroups } from './fixtures';

const groups = treatmentGroups();

describe('multi-speciality routing (department → concern → doctor)', () => {
  it('four departments, each with a general option and at least one concern chip', () => {
    for (const d of ['dental', 'family', 'children', 'eyes']) {
      const g = groups.find((x) => x.id === `concerns:${d}`)!;
      expect(g.options[0].id).toBe(`general:${d}`);
      expect(g.options.length).toBeGreaterThan(1);
    }
  });

  it('every department and doctor maps both ways (doctor lists the department it is listed in)', () => {
    for (const d of content.departments) for (const id of d.doctors) expect(content.doctors.find((x) => x.id === id)!.departments).toContain(d.id);
    expect(content.doctors.find((d) => d.id === 'venugopal-rao')!.departments).toEqual(['children', 'family']);
    expect(content.doctors.find((d) => d.id === 'padmaja-rani')!.departments).toEqual(['eyes', 'family']);
  });

  it('children see only the paediatrician; eyes only the eye doctor; dental only the two prosthodontists', () => {
    expect(findOption(groups, 'general:children')!.doctors).toEqual(slugs(['venugopal-rao']));
    expect(findOption(groups, 'problem:red-eyes')!.doctors).toEqual(slugs(['padmaja-rani']));
    expect(new Set(findOption(groups, 'problem:missing-teeth')!.doctors)).toEqual(new Set(slugs(['phani-krishna', 'deepthi'])));
  });

  it('starting from a doctor shows only that doctor’s concerns, across all their departments', () => {
    const vr = 'dr-g-venugopal-rao';
    const g = optionsFor(groups, 'concerns', { doctor: vr });
    expect(g.map((x) => x.department).sort()).toEqual(['children', 'family']);
    for (const x of g) for (const o of x.options) expect(o.doctors).toContain(vr);
    expect(optionsFor(groups, 'concerns', { doctor: 'dr-t-padmaja-rani' }).some((x) => x.department === 'children')).toBe(false);
  });

  it('every concern chip links to a treatment page in its own department', () => {
    const cats = new Map(content.services.categories.map((c: { slug: string; department: string }) => [c.slug, c.department]));
    for (const p of content.routing.problems) expect(cats.get(p.category)).toBe(p.department);
  });

  it('every treatment list is a draft "to confirm with the clinic"', () => {
    for (const c of content.services.categories) expect(c.status).toBe('placeholder');
  });

  it('deep links pre-fill the wizard', () => {
    expect(resolvePrefill(groups, { problem: 'child-fever' })).toEqual({ treatmentId: 'problem:child-fever', preferredDoctor: null, department: 'children' });
    expect(resolvePrefill(groups, { treatment: 'eye-care/eye-check' }).treatmentId).toBe('treatment:eye-care/eye-check');
    expect(resolvePrefill(groups, { treatment: 'dental-implants' }).department).toBe('dental');
    expect(resolvePrefill(groups, { department: 'eyes' })).toEqual({ treatmentId: null, preferredDoctor: null, department: 'eyes' });
    expect(resolvePrefill(groups, { department: 'nonsense' }).department).toBeNull();
    expect(resolvePrefill(groups, { doctor: 'dr-b-deepthi' })).toEqual({ treatmentId: null, preferredDoctor: 'dr-b-deepthi', department: null });
  });

  it('a preferred doctor narrows an option only when they see it', () => {
    const o = findOption(groups, 'problem:fever-adult');
    expect(doctorsForOption(o, 'dr-t-padmaja-rani')).toEqual(['dr-t-padmaja-rani']);
    expect(doctorsForOption(o, 'dr-b-deepthi')).toEqual(o!.doctors);
  });
});
