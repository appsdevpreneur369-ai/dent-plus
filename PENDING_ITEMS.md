# Pending items: Dent Plus Multi Speciality Dental & Family Clinic (DPC)

Updated 27 Oct 2026 (night). Everything not confirmed is shown on the site as Draft / placeholder.

## Answered by the owner (27 Oct 2026)
- [x] PIN **522007**.
- [x] Hours: continuous **Mon–Sat 9:30 AM – 9:00 PM**, Sunday closed (owner answered "9:00").
- [x] WhatsApp number: **9440919770**.
- [x] **FICOI (USA)** for Dr. G. Phani Krishna: confirmed (also on the signboard).
- [x] **MDS (OSM)** for Dr. B. Deepthi: confirmed as printed (also on the signboard). Shown as "MDS (OSM)", not expanded.
- [x] Tagline "Make your smile brighter with us" may be used (with "Your smile, our priority." and "Expert care in every step.").
- [x] Patient photos: **blur the patients' eyes**.
- [x] Dr. Deepthi's photo: may use the photo of her treating a patient, if clear enough (patient's eyes blurred); else initials avatar.
- [x] Slug `dent-plus-dental-family-clinic` is free on staging (read-only check, 27 Oct).
- [x] Logo SVG approved (27 Oct).

## Still to confirm with the clinic (placeholders on the site)
- [ ] **Hours detail**: "9:00" read as continuous 9:30 AM – 9:00 PM. Directories show a split day (10:00 AM – 1:00 PM and 5:30 – 9:00 PM). Is there an afternoon break? Do all four doctors sit all day, or do the physicians/eye doctor have their own hours? (Each doctor's consultation hours = clinic hours for now, `consultationStatus: placeholder`.)
- [ ] **Clinic email.**
- [ ] **Google Business listing** link / Place ID (needed for the "write a review" link and live Google rating; ask the owner before creating or reusing a Places API key).
- [ ] **Registration numbers** for all four doctors (Dental Council for the two dentists, Medical Council for the two physicians). Tenant sends `PENDING-VERIFICATION-<NAME>`.
- [ ] **Consultation fees** (per department / doctor).
- [ ] **Confirm the dentist in the brown kurta is Dr. Deepthi.** Her profile uses a crop of `treatment-chair-equipment-patient.jpeg` (patient's eyes blurred), on the assumption that she is the only woman dentist on the team. Swap `photo` to null in `content/doctors.json` if not.
- [ ] **Doctor photos** for Dr. Phani Krishna, Dr. Venugopal Rao, Dr. Padmaja Rani (initials avatars until then).
- [ ] What "OSM" stands for (only if the clinic wants it spelled out).
- [ ] Slot length per doctor (15 min assumed for all four).
- [ ] Treatment lists for each department ("to confirm with the clinic" on every list): dental (implants, crowns/bridges/dentures, general dentistry, cleaning, fillings, root canal, extractions, children's dental care, smile care), family medicine, paediatrics, eye care.
- [ ] Does the eye department do surgery in-house, or refer? (Site says "referral for surgery when needed".)
- [ ] Vaccinations: are they given at the clinic? (Site gives general guidance only, no schedule claims.)
- [ ] Staff: real admin / front-desk names and login emails (placeholders `appsdevpreneur369+dpc-…@gmail.com`).
- [ ] Portal subdomain (`dentplus.clinicflow247.com` proposed) and whether they buy a domain.
- [ ] Short clinic name for WhatsApp/SMS messages: the full name is 49 characters (core shows the full name; spec limit 40). Proposed "Dent Plus Clinic".
- [ ] Social media links.
- [ ] Legal drafts reviewed (privacy, terms, disclaimer, cookies); grievance officer name.
- [ ] Article review by the doctors (`reviewStatus: pending` on all four).
- [ ] Photo consent: patients in `patient-treatment.jpeg` and `treatment-chair-equipment-patient*.jpeg` are shown with eyes blurred; confirm the clinic has their consent to publish even so.

## Photo notes
- Patients' eyes blurred by `scripts/build-photos.mjs` (feathered blur boxes, checked visually 27 Oct) in `treatment-in-progress`, `treatment-team`, `treatment-close`, `treatment-room-wide` and the Dr. Deepthi crop. Staff faces (dentist, assistant) are not blurred.
- `exterior-name-board.jpeg` and `exterior-road-side-board.jpeg` are the same file (identical bytes); WhatsApp `…8.18.27` and `…8.17.40` are near-copies of the two signboard shots.
- `dent-plus-banner*.jpeg`: posters with a stock model. Not used as photos. The same poster hangs at reception in `interior-main-entrance.jpeg`: crop it out.
- The signboard's second mark (red heart with family + stethoscope) is not used (no-red rule).

## Needs the owner's yes (not done)
- [x] GitHub: https://github.com/appsdevpreneur369-ai/dent-plus (27 Oct, public; raw patient photos and banners git-ignored).
- [x] Staging onboarding (27 Oct, run by the owner; re-run to add Dr. Phani Krishna after a placeholder-licence clash).
- [x] Staging API CORS += DPC origin (27 Oct, `clinicflow-api-staging-00109-tgx`, 8 existing origins kept).
- [x] Deploy `dpc-frontend-staging` (27 Oct, `00001-pqt`, 256Mi, min 0).
- [x] Post-visit demo data (27 Oct): Lakshmi / Arjun / Saroja Demo + SQL phases A and B.
- [x] Booking e2e against staging: 9/9 (27 Oct). Its 3 "Test Patient" bookings on Thu 29 Oct are kept (owner).
- [ ] Places API key for live Google reviews (only if a Google listing exists).
- [ ] Before the meeting: `dpc-frontend-staging` and `clinicflow-api-staging` min-instances 1; back to 0 after.
- [ ] Staging WhatsApp ON right before the demo, OFF after (same switch as AISHWARYA; check no core deploy is running).
- [ ] Re-run `npm run tenant` after any content change before onboarding.

## Design / site notes (for the owner's review)
- Hero photo is the empty treatment room (`clinic-operatory`); the phone photos are 1200–1600 px, fine for the hero.
- No auto-opening booking popup on this site (booking opens only when asked).
- Draft badges show on staging (`NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=true`), hidden in production builds.

## Core (ClinicFlow), reported, not patched here
- [ ] **Placeholder registration numbers collide across clinics**: `mciRegistrationNumber` is unique platform-wide, so the importer's placeholder convention `PENDING-VERIFICATION-<FIRSTNAME>` fails (`DOCTOR_LICENSE_ALREADY_EXISTS`) when another clinic has a doctor with the same first name. Worked around here with a clinic prefix; the importer reports the failure only as a flag and continues.
- [ ] The staging API logs every SQL statement (Hibernate show-sql), which buries the `[WhatsApp DRY RUN]` lines needed to show message texts in a demo.
Carried over from `D:\AISHWARYA\PENDING_ITEMS.md` (still open there on 27 Oct 2026); re-check before the demo:
- [ ] Staging email intermittently fails (Gmail SMTP `Broken pipe` / TLS); invites and resets may need re-sending.
- [ ] Staff created without a password stay inactive until the invite is used; no admin "resend invite" (workaround `POST /auth/forgot-password`).
- [ ] No per-visit message preview / timeline screen for the clinic admin (message text only in the API log on dry run).
- [ ] No quiet hours for review messages (a morning visit → request around midnight).
- [ ] Messages use the full clinic name (49 characters here); no "name shown in messages" setting yet.
- [ ] Importer (`onboard_tenant.py`) does not send `googleReviewLink` (setup script sets it with `PUT /clinics/{id}`).
- [ ] No queue estimated waiting time; "Call" button has no voice call-out / TV display.
