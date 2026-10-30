# Demo runbook: Dent Plus Multi Speciality Dental & Family Clinic

**Thursday 29 Oct 2026 · about 30 minutes · staging**
Prepared 27 Oct 2026 from `D:\DENT-PLUS` and the core notes in `D:\ClinicFlow` (same shape as `D:\AISHWARYA\docs\Demo_Runbook_2026-10-27.md`). Logins: `D:\DENT-PLUS\credentials\DEMO_LOGINS.local.md` (git-ignored; created after onboarding). Never read passwords out or show them on screen.

Who you are meeting: **Dr. G. Phani Krishna** (prosthodontist & implantologist, lead) and possibly Dr. B. Deepthi, Dr. G. Venugopal Rao, Dr. T. Padmaja Rani. The selling point for this clinic is **one system for four departments**: dental, family medicine, children, eyes.

> Status when written (27 Oct, evening): website built locally and checked; **NOT yet on staging, clinic NOT yet onboarded**. Everything marked ⏳ below depends on Wednesday evening's staging steps (owner's yes).

---

## 0. Read this first: what is and isn't ready

| You want to show | Status | What to do in the demo |
|---|---|---|
| Their own website (logo, colours, four departments, doctors, own photos) | ✅ built · ⏳ staging deploy | Show it on the phone |
| Booking by **department or by doctor** (dental, paediatrician, eye doctor) | ✅ built · ⏳ live once onboarded | Book the paediatrician or eye doctor live, not only dental |
| Patient gets a WhatsApp | ✅ **Live on staging** (30 Oct, owner's yes, `clinicflow-api-staging-00113-6ns`): booking confirmation, reminder (2 h before), thank-you, review request + review reminder. SMS stays test mode (OTP 123456). Applies to **every** staging clinic: switch the three new templates off after the demo (section 13) | Book with a **real** WhatsApp number; 90000… test numbers get nothing |
| Admin sees today's appointments for all four doctors | ✅ core | Show it |
| Live queue with **token number** | ✅ core (Token N, position #, refreshes every 30 s) | Show it |
| Queue **estimated waiting time** | ❌ **not built** | Don't promise it. "Next on the roadmap" only if asked |
| **Call out the name** | ⚠️ A **Call** button marks the patient as called (status In consultation). **No voice announcement, no TV display** | Show the button; never call it a voice call-out |
| Doctor: start consultation, Rx, finalise & end | ✅ core | Show it |
| Post-visit thank-you / review request / reminder | ✅ core · ⏳ demo patients seeded | Show the three demo patients at their stages (section 8) |
| Google review link | ⚠️ **No Google listing confirmed** | Staging uses a Google *search* link as a stand-in (`--demo-review-link`). Say so if asked |
| Per-visit message preview screen | ❌ not in the app | Use the printed message texts |
| Registration numbers, fees, email, three doctor photos | ⏳ Draft badges on the site | Point at a Draft badge: "Nothing is invented; these wait for you" |

---

## 1. Before the meeting

**Wednesday evening (after the owner's yes; check first that no other session is deploying core: `gcloud builds list --ongoing`)**
- [ ] `python scripts/staging/setup-staging.py --admin-email <super admin> --demo-review-link`
      (import, ACTIVE, dental suite ON, logo + favicon, 15-min slots and Mon–Sat 09:30–21:00 schedules for all four doctors, review link stand-in)
- [ ] Staging API CORS += `https://dpc-frontend-staging-1071497363324.asia-south1.run.app` (`--update-env-vars`, keep every existing origin)
- [ ] Deploy `dpc-frontend-staging` (256Mi, min 0) — commands in `CLAUDE.md` → Deployments
- [ ] `python scripts/staging/seed-post-visit-demo.py --admin-email <super admin>` + phase A SQL now, phase B SQL ≥ 10 min later
- [ ] `node scripts/qa/e2e-booking.mjs https://dpc-frontend-staging-1071497363324.asia-south1.run.app qa/e2e` → 9/9
- [ ] Staff invites: set passwords from the invite emails (staging email is flaky: re-send with `POST /auth/forgot-password`), note them in `credentials/DEMO_LOGINS.local.md`

**Thursday T − 60 min**
- [ ] Branded login page shows the Dent Plus logo and name: `/clinic/dent-plus-dental-family-clinic/login`
- [ ] **Today's schedules** exist for the doctors you will book (free slots after the meeting time)
- [ ] One dry-run booking each for the **paediatrician** and the **eye doctor**, then cancel them
- [ ] Demo patients visible: Patients → search "Demo" (Lakshmi, Arjun, Saroja)
- [ ] Thursday already has **3 kept test bookings** from the staging e2e (owner: keep them, so the day's list isn't empty), all named **"Test Patient"**: 10:00 Dr. Venugopal Rao (child with fever), 14:30 Dr. Padmaja Rani (eye strain), 19:15 Dr. Phani Krishna (missing tooth). If asked: "test bookings from this week's checks". Pick other slots for the live booking.

**T − 30 min: keep website and API warm (no 50-second cold start)**
```bash
gcloud run services update dpc-frontend-staging --project sincere-stock-499113-f1 --region asia-south1 --min-instances 1
gcloud run services update clinicflow-api-staging --project sincere-stock-499113-f1 --region asia-south1 --min-instances 1
```
- [ ] Phone charged, laptop on mains, hotspot as backup internet.

**One browser per role** (roles in the same browser share one sign-in):
- **Phone:** patient (their website)
- **Laptop, Chrome:** Clinic Admin (front desk)
- **Laptop, Edge or Chrome incognito:** Doctor

| Role | Page | URL |
|---|---|---|
| Patient (phone) | Website | https://dpc-frontend-staging-1071497363324.asia-south1.run.app |
| Patient (phone) | Book (children) | …/book?department=children |
| Admin + Doctor | Branded login | https://clinicflow-frontend-staging-1071497363324.asia-south1.run.app/clinic/dent-plus-dental-family-clinic/login |
| Admin | Today's Queue | `…/admin/queue` (after login) |
| Doctor | Appointments | `…/doctor/appointments` (after login) |

---

## 2. Opening (1 minute)

> "Doctor, this is your clinic running on ClinicFlow247: your website, patients booking any of your four doctors, your front desk, the consultation and prescription, and what happens automatically after the visit. About 25 minutes."

---

## 3. PATIENT: website + booking (5 minutes, on the phone)

1. Open **their website**, hand over the phone.
   - **Say:** "Your logo, redrawn sharp from your board; your colours; your four departments; your own photos."
   - Show the **department switcher** (Dental / Family / Children / Eyes): doctors and services change in place.
   - Point at a **Draft** badge: "Registration numbers, fees and email wait for you. Nothing on the site is invented."
2. **Multi-speciality booking** (the point of difference): hero card → **Children** → "See free times" → **"Child with fever or cough"** → it goes straight to Dr. Venugopal Rao's free days.
3. Pick **today** (a slot after the meeting) → demo name + mobile `90000115xx` → OTP **123456** → confirmed.
   - **Say:** "That is a real appointment with your paediatrician, not a contact form. Patients book any doctor, day or night."
4. Optional second booking from **Dr. Padmaja Rani's page** → "Book with Dr. Padmaja Rani": only eye and family concerns appear.

---

## 4. Sticky bar and fallbacks (1 minute)
- Point at the bottom bar on the phone: **Call / Book / Directions**.
- **Say:** "If the booking system is ever unreachable, the site never pretends: it sends a request or opens WhatsApp to 94409 19770, and says so."

## 5. PATIENT: WhatsApp messages (2 minutes)
- **Say honestly:** "On this test system WhatsApp is in test mode, so nothing reaches a phone. This is exactly what your patient receives once you go live."
- Confirmation after booking · reminder before the visit · reschedule/cancel link · sent with **your clinic's name**.
- Note: core currently uses the **full name** (49 characters) in messages; a short-name setting is on the core list.

---

### 5b. Live WhatsApp in the meeting (owner's phone)
1. **Booking confirmation:** book on the site with the owner's real mobile → WhatsApp within a minute.
2. **Reminder:** book a slot about **2 h 05 min** ahead → the reminder arrives within ~10 min (job every 10 min).
3. **Thank-you + review request** (after "Finalise & end visit" in section 7):
   `python scripts/staging/run-demo-sql.py --recent` → copy the appointment id →
   `python scripts/staging/run-demo-sql.py --pull-forward <id>` → both arrive at the next job run (≤ 10 min).
4. **Review reminder:** once the request shows SENT: `--pull-forward <id> --review-reminder`.
   Only that one Dent Plus appointment changes; the script refuses any other clinic's appointment.

## 6. CLINIC ADMIN: today at the front desk (6 minutes, Chrome)

1. Sign in on the **branded login** (Dent Plus logo, no ClinicFlow247 name).
2. **Dashboard** → **Appointments**: today's bookings for **all four doctors** in one list, with the concern as the visit reason.
   - **Say:** "One front desk for dental, family, children's and eye patients."
3. **Walk-in token:** Book for Patient → Token mode → walk-in (name + mobile) → **Token N**, choose the doctor.
4. **Today's Queue:** position #, Token N, status. Mark the booked child **Checked in**, click **Call** → In consultation.
   - **Don't** say "estimated time" or "announces the name".

---

## 7. DOCTOR: consultation and prescription (6 minutes, second browser)

1. Sign in as the doctor you booked (e.g. Dr. Venugopal Rao) → today → the called patient on top.
2. **Start consultation** → **Prescription**: complaint (from the booking), diagnosis, medicines, advice, follow-up date; **private notes** ("only you see these").
3. **Save draft**, then **Finalise & end visit** → open the **prescription PDF** (letterhead, QR check).
4. For Dr. Phani Krishna: **dental treatment plan** (dental suite ON) → e.g. "Implant 36" with cost → **Print estimate**.
   - **Say:** "The plan stays internal until treatment starts; each sitting is invoiced separately."

## 8. AFTER THE VISIT: automatic follow-up (3 minutes)

- **Say:** "Ending the visit scheduled the follow-up. Nobody has to remember."

| When | What the patient gets (WhatsApp; dry-run on staging) |
|---|---|
| ~2 hours after the visit | Thank-you for visiting the clinic and the doctor |
| Next step (+12 h) | Request for honest feedback + link to the Google review page |
| ~2–3 days later, **only if the link wasn't tapped** | One gentle reminder, then nothing more |

- Patients → search **"Demo"** (stages verified on staging 27 Oct, dry-run): **Saroja** (eyes): thank-you, review request and reminder all sent · **Arjun** (child): thank-you + review request sent, reminder due 30 Oct · **Lakshmi** (dental): by Thursday her thank-you (due 28 Oct 02:03 IST) and review request (28 Oct 14:03 IST) will also show as sent.
- **"Thank-you scheduled"** is shown by the visit the doctor ends live in section 7: it appears as PENDING, due ~2 h later.
- **Say:** "Every patient gets the same polite request; Google doesn't allow asking only happy patients. No medical details in messages."
- **Be honest:** "Your Google listing link is needed for the real review link; today it's a stand-in." Requests currently go out ~14 h after the visit with no quiet hours (core gap; may arrive at night).

## 9. PATIENT portal (2 minutes, optional)
- Sign the patient in on the phone: appointments, prescription PDF, treatment plan (after start), **no private notes**.

## 10. Pricing and close (4 minutes)
1. **Invoices:** mark the visit paid (cash/UPI) → invoice.
2. **Analytics:** bookings, completed visits, no-shows.
3. **Pricing** (`/pricing` on the portal): show the band that matches their **weekly patients across all four doctors**, billing periods (free months on longer terms), **Branded** (white-label: their logo, no ClinicFlow247 name) and **own domain**. Read the figures from the live page; don't quote from memory.
4. **Close:** "Send me the registration numbers, clinic email, fees, the Google listing link and your domain choice. Your website and WhatsApp go live as soon as we have them." Agree a **start date**.

---

## 11. If something goes wrong

| Problem | Fallback |
|---|---|
| Booking shows no slots | Schedule missing for that doctor on staging: book tomorrow, or use a walk-in token |
| Site falls back to enquiry/WhatsApp | API cold start: wait 30 s and retry (that's why min-instances is 1) |
| Signed out unexpectedly | Two roles in one browser: use the separate browser per role |
| Portal shows ClinicFlow247 branding | Hard refresh (Ctrl+Shift+R); favicon may be cached |
| Asked for estimated time / voice call-out | "On the next release list; I'll show you when it's ready." Note it |
| Asked for a real WhatsApp | "Live once your clinic is switched on; I'll send a test from your clinic name on day one" |
| Asked about eye surgery or vaccines in the clinic | Site says referral / guidance only until the clinic confirms; ask them (section 12) |

## 12. Questions to ask (write the answers down)

- [ ] Patients per week **per department**; chairs; consulting rooms
- [ ] Hours: continuous 9:30–9 or a lunch break? **Each doctor's own hours** (do the physicians and eye doctor sit all day?)
- [ ] Slot length per doctor (15 min assumed for all)
- [ ] Walk-ins? How does the desk run the queue today, across four doctors?
- [ ] Registration numbers (dental + medical council), consultation fees, clinic email
- [ ] Google Business listing link (for reviews and the map pin)
- [ ] Is the dentist in the brown kurta in the treatment photos Dr. Deepthi? Photos of the other three doctors
- [ ] Consent for the patient photos (eyes blurred today)
- [ ] Vaccinations at the clinic? Eye surgery in-house or referral?
- [ ] Own domain (.in / .com)? Branded or "Powered by ClinicFlow247"?
- [ ] Short clinic name for messages (e.g. "Dent Plus Clinic")
- [ ] Which feature mattered most today?

## 13. After the meeting
- **WhatsApp off again** (owner's go): `gcloud run services update-traffic clinicflow-api-staging --project sincere-stock-499113-f1 --region asia-south1 --to-revisions clinicflow-api-staging-00112-5kw=100` only if no newer core revision exists; otherwise `--update-env-vars MSG91_WA_TEMPLATE_APPT_REMINDER=,MSG91_WA_TEMPLATE_REVIEW_REQUEST=,MSG91_WA_TEMPLATE_REVIEW_REMINDER=` (confirmation + thank-you were already on before 30 Oct).

- [ ] Scale back to zero:
  ```bash
  gcloud run services update dpc-frontend-staging --project sincere-stock-499113-f1 --region asia-south1 --min-instances 0
  gcloud run services update clinicflow-api-staging --project sincere-stock-499113-f1 --region asia-south1 --min-instances 0
  ```
- [ ] If staging WhatsApp was switched on for the demo: switch it OFF (AISHWARYA CLAUDE.md → "Demo WhatsApp switch").
- [ ] Cancel the demo bookings.
- [ ] Answers → `D:\DENT-PLUS\PENDING_ITEMS.md`; feature requests → report to the core owner (`D:\ClinicFlow` is read-only from here).
- [ ] Same-day thank-you message with the start date and the list of items needed.
