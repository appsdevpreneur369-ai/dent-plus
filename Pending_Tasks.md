# Pending tasks: Dent Plus (DPC), for the owner's reference

Updated 28 Oct 2026 (night). Full detail of every placeholder: `PENDING_ITEMS.md`. Demo steps: `docs/DEMO_RUNBOOK.md`.

## Done so far (27 Oct 2026)
- [x] Website built (45 pages), `npm run check` green, logo SVG approved
- [x] GitHub: https://github.com/appsdevpreneur369-ai/dent-plus (`main`, latest `c8dd435`; public repo, raw patient photos and stock-model banners kept out)
- [x] Staging website: https://dpc-frontend-staging-1071497363324.asia-south1.run.app (`dpc-frontend-staging-00001-pqt`)
- [x] Staging API CORS includes the site (`clinicflow-api-staging-00109-tgx`, rollback `00108-s62`)
- [x] Clinic onboarded on staging (`dent-plus-dental-family-clinic`, ACTIVE, ENTERPRISE, 4 doctors with slots)
- [x] Demo patients Lakshmi / Arjun / Saroja + SQL phases A and B; post-visit stages verified (dry-run)
- [x] Booking e2e on staging 9/9 (3 "Test Patient" bookings on Thu 29 Oct kept on purpose)

## Questions for the clinic (ask before or during Thursday's meeting)
- [ ] **Hours:** continuous 9:30 AM – 9:00 PM, or is there a lunch break? (Directories show 10–1 and 5:30–9.)
- [ ] **Each doctor's own hours:** do the physicians and the eye doctor sit all day like the dentists?
- [ ] **Slot length** per doctor (15 min assumed for all four).
- [ ] **Clinic email** address.
- [ ] **Google Business listing** link (needed for the real review link and the map pin).
- [ ] **Registration numbers** for all four doctors (State Dental Council / Medical Council).
- [ ] **Consultation fees** per doctor / department.
- [ ] **Doctor photos** for Dr. Phani Krishna, Dr. Venugopal Rao, Dr. Padmaja Rani.
- [ ] **Is the dentist in the brown kurta in the treatment photos Dr. Deepthi?** (Her profile uses that photo.)
- [ ] **Patient photo consent:** patients' eyes are blurred; can they be shown at all?
- [ ] What does **"OSM"** stand for (only if they want it spelled out)?
- [ ] **Treatment lists:** confirm what each department actually offers (all marked "to confirm").
- [ ] **Vaccinations** given at the clinic, or guidance only?
- [ ] **Eye surgery:** in-house or referral?
- [ ] **Walk-ins:** do they take them? How does the desk run the queue today across four doctors?
- [ ] **Patients per week** per department (for the pricing band).
- [ ] **Staff:** names and real login emails for admin / front desk (placeholders `appsdevpreneur369+dpc-…@gmail.com` today).
- [ ] **Domain:** buy one (.in / .com)? Subdomain `dentplus.clinicflow247.com`? Branded or "Powered by ClinicFlow247"?
- [ ] **Short clinic name for WhatsApp/SMS** (full name is 49 characters; e.g. "Dent Plus Clinic").
- [ ] **Social media** links.
- [ ] Legal drafts review (privacy, terms, disclaimer, cookies) and grievance officer name.
- [ ] Doctors to review the four patient guides.
- [ ] Which feature mattered most to them in the demo?

## Before the demo (Thursday 29 Oct)
- [ ] Set staff passwords from the invite emails (staging email is flaky: re-send via forgot-password if missing); note them in `credentials/DEMO_LOGINS.local.md` (git-ignored).
- [ ] T−60 min: branded login page shows the Dent Plus logo; one dry-run booking each for the paediatrician and the eye doctor, then cancel them.
- [ ] T−30 min: `dpc-frontend-staging` and `clinicflow-api-staging` min-instances 1 (commands in the runbook). Google Cloud change: tell Claude when.
- [ ] Pick live-booking slots away from the kept test bookings (10:00, 14:30, 19:15).
- [ ] WhatsApp: **don't** use AISHWARYA's switch to `00107-tm8` (lacks the DPC origin). For real messages, apply the WhatsApp env vars on the latest revision instead.

## After the demo
- [ ] min-instances back to 0 for both services.
- [ ] If WhatsApp was switched on, switch it off.
- [ ] Write the clinic's answers into `PENDING_ITEMS.md` and swap the placeholders in `/content` (then `npm run tenant`, redeploy).
- [ ] Same-day thank-you message with the start date and the list of items still needed.
- [ ] Production only after the clinic sends real data and says go.
