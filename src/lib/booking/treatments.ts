// Booking options and option → doctor mapping, built from content (pure; unit-tested).
// ClinicFlow books appointments with a DOCTOR, not a treatment: every option carries the doctor(s) who see it.
// Multi-speciality: every option belongs to a department (dental / family / children / eyes), so the wizard can
// start from a department OR from a doctor and only show the concerns that fit.

export type TreatmentOption = { id: string; label: string; department: string; doctors: string[] };
export type TreatmentGroup = { id: string; label: string; department: string; kind: 'concerns' | 'treatments'; options: TreatmentOption[] };

export type TreatmentSource = {
  departments: { id: string; title: string; generalLabel: string; doctors: string[] }[];
  problems: { id: string; label: string; department: string; doctors: string[] }[];
  categories: {
    slug: string;
    title: string;
    department: string;
    doctors: string[];
    subTreatments: { slug: string; title: string; doctors?: string[] }[];
  }[];
  allowDirectSpecialistBooking: boolean;
  defaultDoctor: string;
};

export function buildTreatmentGroups(src: TreatmentSource): TreatmentGroup[] {
  const route = (doctors: string[]) => (src.allowDirectSpecialistBooking ? doctors : [src.defaultDoctor]);
  const concerns: TreatmentGroup[] = src.departments.map((d) => ({
    id: `concerns:${d.id}`,
    label: d.title,
    department: d.id,
    kind: 'concerns',
    options: [
      { id: `general:${d.id}`, label: d.generalLabel, department: d.id, doctors: route(d.doctors) },
      ...src.problems.filter((p) => p.department === d.id).map((p) => ({ id: `problem:${p.id}`, label: p.label, department: d.id, doctors: route(p.doctors) })),
    ],
  }));
  const cats: TreatmentGroup[] = src.categories.map((c) => ({
    id: `category:${c.slug}`,
    label: c.title,
    department: c.department,
    kind: 'treatments',
    options: c.subTreatments.map((s) => ({
      id: `treatment:${c.slug}/${s.slug}`,
      label: s.title,
      department: c.department,
      doctors: route(s.doctors ?? c.doctors),
    })),
  }));
  return [...concerns, ...cats];
}

export const allOptions = (groups: TreatmentGroup[]) => groups.flatMap((g) => g.options);

export function findOption(groups: TreatmentGroup[], id: string | null | undefined): TreatmentOption | undefined {
  return id ? allOptions(groups).find((o) => o.id === id) : undefined;
}

/** Options to offer once a department and/or doctor is chosen (a doctor narrows to what they see). */
export function optionsFor(groups: TreatmentGroup[], kind: TreatmentGroup['kind'], filter: { department?: string | null; doctor?: string | null }): TreatmentGroup[] {
  return groups
    .filter((g) => g.kind === kind && (!filter.department || g.department === filter.department))
    .map((g) => ({ ...g, options: g.options.filter((o) => !filter.doctor || o.doctors.includes(filter.doctor)) }))
    .filter((g) => g.options.length);
}

/**
 * Doctors to fetch slots for. A preferred doctor narrows the list when that doctor sees the option;
 * otherwise every mapped doctor is used and their slots are merged.
 */
export function doctorsForOption(option: TreatmentOption | undefined, preferredDoctor?: string | null): string[] {
  if (!option) return [];
  if (preferredDoctor && option.doctors.includes(preferredDoctor)) return [preferredDoctor];
  return option.doctors;
}

/** Map deep-link params (?department=, ?problem=, ?treatment=<category or category/sub>, ?doctor=) to a starting point. */
export function resolvePrefill(
  groups: TreatmentGroup[],
  params: { department?: string | null; problem?: string | null; treatment?: string | null; doctor?: string | null },
): { treatmentId: string | null; preferredDoctor: string | null; department: string | null } {
  const options = allOptions(groups);
  const preferredDoctor = params.doctor || null;
  const known = (d?: string | null) => (d && groups.some((g) => g.department === d) ? d : null);
  const pick = (o: TreatmentOption | undefined) => ({ treatmentId: o?.id ?? null, preferredDoctor, department: o?.department ?? known(params.department) });
  if (params.problem) {
    const o = options.find((x) => x.id === `problem:${params.problem}`);
    if (o) return pick(o);
  }
  if (params.treatment) {
    const exact = options.find((o) => o.id === `treatment:${params.treatment}`);
    if (exact) return pick(exact);
    const group = groups.find((g) => g.id === `category:${params.treatment}`);
    if (group) return pick((preferredDoctor && group.options.find((o) => o.doctors.includes(preferredDoctor))) || group.options[0]);
  }
  // A department or a doctor alone opens the concern step for them (nothing pre-selected).
  return { treatmentId: null, preferredDoctor, department: known(params.department) };
}
