#!/usr/bin/env python3
"""
POST-VISIT automation demo data for Dent Plus (DPC) on the ClinicFlow STAGING API (dry-run channels).
NOT YET APPROVED: run only after the owner's yes, after setup-staging.py (with --demo-review-link until the real review
link exists: core creates no review rows without one), and when no other session is deploying core to staging.

Creates three demo patients (last name "Demo", dummy mobiles 90000114 01-03, undeliverable @dpc.test emails) with a
COMPLETED visit each, ONE PER DEPARTMENT (dental / children / eyes: the multi-speciality angle), through the same API
reception uses:
  POST /appointments/quick-visit (modular pricing, if deployed) -> else POST /appointments/walk-in-token + start + complete.
Completion fires core's ConsultationCompletedEvent -> thank-you (+2 h) and review request (+14 h) rows, timed from NOW.

Core has no API to move those times, so the three stages are made by two small SQL files written to qa/staging/,
scoped to these three appointment ids only (run them on the STAGING database, with the owner's yes):
  phase A (now):         patient 2 "yesterday" and patient 3 "3 days ago": visit date moved back, thank-you and review
                         request due now -> the jobs (every 10 min) send them as [WhatsApp DRY RUN].
  phase B (>=10 min later): patient 3: reminder due now -> sent as [DRY RUN]; or, with --clicked, the link is marked
                         clicked first -> reminder SKIPPED (ALREADY_CLICKED).
Patient 1 ("just finished") is left alone: its thank-you shows as scheduled.

    python scripts/staging/seed-post-visit-demo.py --admin-email <super admin email> [--clicked]
"""
import argparse
import getpass
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

STAGING = "https://clinicflow-api-staging-1071497363324.asia-south1.run.app/api/v1"
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "qa" / "staging"
SLUG = "dent-plus-dental-family-clinic"
PATIENTS = [
    # doctor = the ClinicFlow doctor's firstName (from tenant/dent-plus-dental-family-clinic.json)
    {"key": "just-finished", "firstName": "Lakshmi", "lastName": "Demo", "phone": "9000011401", "doctor": "Phani Krishna", "notes": "Demo: denture review"},
    {"key": "yesterday", "firstName": "Arjun", "lastName": "Demo", "phone": "9000011402", "doctor": "Venugopal Rao", "notes": "Demo: child with fever"},
    {"key": "three-days-ago", "firstName": "Saroja", "lastName": "Demo", "phone": "9000011403", "doctor": "Padmaja Rani", "notes": "Demo: eye check"},
]


def call(base, method, path, token=None, body=None):
    req = urllib.request.Request(base + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", **({"Authorization": "Bearer " + token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode()
            parsed = json.loads(raw) if raw else None
            return r.status, (parsed.get("data", parsed) if isinstance(parsed, dict) and "success" in parsed else parsed)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def ids_sql(ids):
    return ", ".join(f"'{i}'" for i in ids)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--admin-email", required=True)
    ap.add_argument("--base-url", default=STAGING)
    ap.add_argument("--clicked", action="store_true", help="patient 3 clicked the review link -> reminder SKIPPED")
    args = ap.parse_args()
    base = args.base_url.rstrip("/")
    if "staging" not in base and "localhost" not in base:
        sys.exit("STAGING or local API only.")
    password = getpass.getpass(f"SUPER_ADMIN password for {args.admin_email}: ")
    status, auth = call(base, "POST", "/auth/login", body={"email": args.admin_email, "password": password})
    if status != 200 or (auth.get("user") or {}).get("role") not in ("SUPER_ADMIN", "ROLE_SUPER_ADMIN"):
        sys.exit(f"Login failed or not a super admin (HTTP {status}).")
    token = auth["accessToken"]

    status, clinics = call(base, "GET", "/clinics?search=dent%20plus", token)
    clinic = next((c for c in (clinics if status == 200 else []) if c.get("slug") == SLUG), None)
    if not clinic:
        sys.exit("Clinic not found: run setup-staging.py first.")
    cid = clinic["id"]
    _, full = call(base, "GET", f"/clinics/{cid}", token)
    if not (full or {}).get("googleReviewLink"):
        print("WARNING: googleReviewLink is empty -> core will create thank-you rows only, no review request/reminder.")
    _, doctors = call(base, "GET", f"/clinics/{cid}/doctors", token)
    by_name = {d.get("firstName"): d for d in doctors or []}
    missing = [p["doctor"] for p in PATIENTS if p["doctor"] not in by_name]
    if missing:
        sys.exit(f"Doctors not found on this clinic: {missing} (run setup-staging.py first).")

    created = []
    for p in PATIENTS:
        doctor = by_name[p["doctor"]]
        _, branches = call(base, "GET", f"/clinics/{cid}/doctors/{doctor['id']}/branches", token)
        branch_id = branches[0]["branchId"]
        body = {"doctorId": doctor["id"], "branchId": branch_id, "notes": p["notes"],
                "walkIn": {"firstName": p["firstName"], "lastName": p["lastName"], "phone": p["phone"],
                           "email": f"demo+{p['key']}@dpc.test", "clinicId": cid, "forceNew": False}}
        st, appt = call(base, "POST", "/appointments/quick-visit", token, body)
        how = "quick-visit"
        if st in (404, 405):  # not deployed on this environment yet
            how = "walk-in-token + start + complete"
            st, appt = call(base, "POST", "/appointments/walk-in-token", token, body)
            if st in (200, 201):
                call(base, "PUT", f"/appointments/{appt['id']}/start", token)
                st, appt = call(base, "PUT", f"/appointments/{appt['id']}/complete", token)
        if st not in (200, 201):
            sys.exit(f"{p['firstName']}: HTTP {st} {appt}")
        print(f"{p['key']:<15} {p['firstName']} {p['lastName']} with Dr. {p['doctor']} -> appointment {appt['id']} {appt.get('status')} ({how})")
        created.append({**p, "appointmentId": appt["id"]})

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "post-visit-demo.json").write_text(json.dumps({"clinicId": cid, "patients": created}, indent=2), encoding="utf-8")
    p2, p3 = created[1]["appointmentId"], created[2]["appointmentId"]
    (OUT / "post-visit-demo-phaseA.sql").write_text(f"""-- STAGING ONLY. Phase A of the post-visit demo (written by seed-post-visit-demo.py). Touches 2 appointments only.
BEGIN;
UPDATE appointments SET appointment_date = appointment_date - 1 WHERE id = '{p2}';
UPDATE appointments SET appointment_date = appointment_date - 3 WHERE id = '{p3}';
UPDATE post_visit_thank_you_dispatch SET scheduled_at = NOW() - INTERVAL '1 minute' WHERE appointment_id IN ({ids_sql([p2, p3])}) AND status = 'PENDING';
UPDATE google_review_dispatch SET request_scheduled_at = NOW() - INTERVAL '1 minute' WHERE appointment_id IN ({ids_sql([p2, p3])}) AND request_status = 'PENDING';
COMMIT;
-- Then wait for the next job run (every 10 min): thank-you + review request SENT ([WhatsApp DRY RUN] in the API log).
""", encoding="utf-8")
    clicked = f"UPDATE google_review_dispatch SET clicked_at = NOW() - INTERVAL '1 day' WHERE appointment_id = '{p3}';\n" if args.clicked else ""
    (OUT / "post-visit-demo-phaseB.sql").write_text(f"""-- STAGING ONLY. Phase B (run >= 10 min after phase A, once patient 3's review request shows SENT). 1 appointment.
BEGIN;
{clicked}UPDATE google_review_dispatch SET reminder_scheduled_at = NOW() - INTERVAL '1 minute' WHERE appointment_id = '{p3}' AND request_status = 'SENT' AND reminder_status = 'PENDING';
COMMIT;
-- Next job run: reminder {'SKIPPED (ALREADY_CLICKED)' if args.clicked else 'SENT ([WhatsApp DRY RUN])'}.
-- Check: SELECT a.id, d.request_status, d.reminder_status, d.reminder_reason_code, d.clicked_at FROM google_review_dispatch d JOIN appointments a ON a.id = d.appointment_id WHERE a.id IN ({ids_sql([c['appointmentId'] for c in created])});
""", encoding="utf-8")
    print(f"\nWrote qa/staging/post-visit-demo.json, post-visit-demo-phaseA.sql, post-visit-demo-phaseB.sql")


if __name__ == "__main__":
    main()
