#!/usr/bin/env python3
"""
Dent Plus Multi Speciality Dental & Family Clinic (DPC) on the ClinicFlow STAGING API -- run by a SUPER_ADMIN.
NOT YET APPROVED: run only after the owner's explicit yes, and only after checking that no other session is
deploying core to staging at the same moment (the importer writes to the shared staging API).

Each step is safe to re-run:
  1. Onboards the clinic from tenant/dent-plus-dental-family-clinic.json with core's importer
     (D:\\ClinicFlow\\clinicflow-api\\tools\\tenant-onboarding\\onboard_tenant.py, used read-only).
     Staging copy: customDomain left empty (no subdomain yet; the shared portal serves /clinic/<slug>).
     Staff accounts are invite-by-email (no passwords in the file).
  2. Sets the clinic ACTIVE (new clinics start PENDING) and switches the dental suite ON.
  3. Uploads the logo (public/brand/logo-mark.png) and favicon (src/app/icon.png).
  4. All four doctors: slot length from content/doctors.json and a weekly schedule from content/clinic.json hours
     (closed days, i.e. Sunday, get no schedule row).
  5. Google review link (the importer does not send it): the approved write-review URL from content/clinic.json, or,
     only with --demo-review-link, the clinic's Google search URL (googleReview.stagingDemoUrl) so the review request
     can be shown in the demo. Without either, core creates no review-request rows for this clinic.

The password is asked for at the prompt and never written anywhere. Core's importer takes it as a command-line
argument (its own interface), so it is briefly visible to other processes on this machine while step 1 runs.

    python scripts/staging/setup-staging.py --admin-email <super admin email> [--demo-review-link]
"""
import argparse
import getpass
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

STAGING = "https://clinicflow-api-staging-1071497363324.asia-south1.run.app/api/v1"
ROOT = Path(__file__).resolve().parents[2]
IMPORTER = Path(r"D:\ClinicFlow\clinicflow-api\tools\tenant-onboarding\onboard_tenant.py")
OUT = ROOT / "qa" / "staging"
TENANT = ROOT / "tenant" / "dent-plus-dental-family-clinic.json"
SLUG = "dent-plus-dental-family-clinic"
ISO_DAY = {"monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4, "friday": 5, "saturday": 6, "sunday": 7}


def content(name):
    return json.loads((ROOT / "content" / name).read_text(encoding="utf-8"))


def call(base, method, path, token=None, body=None, data=None, content_type="application/json"):
    req = urllib.request.Request(base + path, method=method,
                                 data=data if data is not None else (json.dumps(body).encode() if body is not None else None),
                                 headers={"Content-Type": content_type, **({"Authorization": "Bearer " + token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode()
            parsed = json.loads(raw) if raw else None
            return r.status, (parsed.get("data", parsed) if isinstance(parsed, dict) and "success" in parsed else parsed)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def upload(base, token, clinic_id, kind, file):
    boundary = "----DpcStagingBoundary"
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{file.name}\"\r\n"
            f"Content-Type: image/png\r\n\r\n").encode() + file.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    return call(base, "POST", f"/clinics/{clinic_id}/upload-image?type={kind}", token, data=body,
                content_type=f"multipart/form-data; boundary={boundary}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--admin-email", required=True)
    ap.add_argument("--base-url", default=STAGING)
    ap.add_argument("--demo-review-link", action="store_true",
                    help="STAGING DEMO ONLY: use the clinic's Google search URL as the review link until the real one arrives")
    args = ap.parse_args()
    base = args.base_url.rstrip("/")
    if "staging" not in base:
        sys.exit("This script is for the STAGING API only.")
    password = getpass.getpass(f"SUPER_ADMIN password for {args.admin_email}: ")

    status, auth = call(base, "POST", "/auth/login", body={"email": args.admin_email, "password": password})
    role = (auth.get("user") or {}).get("role") if isinstance(auth, dict) else None
    if status != 200 or role not in ("SUPER_ADMIN", "ROLE_SUPER_ADMIN"):
        sys.exit(f"Login failed or not a super admin (HTTP {status}, role {role}).")
    token = auth["accessToken"]
    OUT.mkdir(parents=True, exist_ok=True)

    # 1. Import (idempotent) from a staging copy of the tenant file
    config = json.loads(TENANT.read_text(encoding="utf-8"))
    config["clinic"]["customDomain"] = None
    config["clinic"]["_note_customDomain"] = "STAGING copy: empty (no subdomain, no wildcard DNS)."
    staged = OUT / "dent-plus.staging.json"
    staged.write_text(json.dumps(config, indent=2), encoding="utf-8")
    print("1/5 Onboarding Dent Plus Multi Speciality Dental & Family Clinic ...")
    rc = subprocess.call([sys.executable, str(IMPORTER), "--base-url", base, "--admin-email", args.admin_email,
                          "--admin-password", password, "--config", str(staged),
                          "--report", str(OUT / "onboard_report_staging.json")])
    if rc != 0:
        sys.exit("onboard_tenant.py failed -- see its output above.")

    status, clinics = call(base, "GET", "/clinics?search=dent%20plus", token)
    clinic = next((c for c in (clinics if status == 200 else []) if c.get("slug") == SLUG), None)
    if not clinic:
        sys.exit(f"Clinic {SLUG} not found after onboarding (HTTP {status}).")
    cid = clinic["id"]
    print(f"   clinic id {cid}")

    # 2. ACTIVE + dental suite
    if clinic.get("status") != "ACTIVE":
        print("2/5 Activate:", call(base, "PUT", f"/clinics/{cid}", token, {"status": "ACTIVE"})[0])
    else:
        print("2/5 Already ACTIVE")
    _, full = call(base, "GET", f"/clinics/{cid}", token)
    overrides = dict((full or {}).get("featureOverrides") or {})
    overrides["dental_suite"] = True
    print("    dental suite ON:", call(base, "PATCH", f"/clinics/{cid}/features", token, {"overrides": overrides})[0])

    # 3. Logo + favicon (the same files the website uses)
    print("3/5 Logo:", upload(base, token, cid, "logo", ROOT / "public" / "brand" / "logo-mark.png")[0],
          " Favicon:", upload(base, token, cid, "favicon", ROOT / "src" / "app" / "icon.png")[0])

    # 4. Doctor slots + weekly schedule from the site's hours (closed days skipped)
    slot = content("doctors.json")["consultSlotMinutes"]
    days = content("clinic.json")["hours"]["days"]
    status, doctors = call(base, "GET", f"/clinics/{cid}/doctors", token)
    for d in doctors if status == 200 else []:
        print(f"4/5 Dr. {d.get('firstName')} {d.get('lastName')}: {slot}-min slots",
              call(base, "PUT", f"/clinics/{cid}/doctors/{d['id']}", token, {"appointmentDurationMinutes": slot})[0])
        _, assigned = call(base, "GET", f"/clinics/{cid}/doctors/{d['id']}/branches", token)
        if not assigned:
            print("    WARNING: not assigned to a branch -- no schedule set (Admin > Doctors)")
        for a in assigned or []:
            for day in days:
                if not day["sessions"]:
                    print(f"    {day['day']:<9} closed (no schedule)")
                    continue
                for s in day["sessions"]:
                    st, _ = call(base, "POST", f"/clinics/{cid}/doctors/{d['id']}/schedules", token,
                                 {"branchId": a["branchId"], "dayOfWeek": ISO_DAY[day["day"]], "startTime": s["opens"],
                                  "endTime": s["closes"], "isActive": True})
                    print(f"    {day['day']:<9} {s['opens']}-{s['closes']} -> {st}")

    # 5. Google review link
    review = content("clinic.json")["googleReview"]
    link = review["writeReviewUrl"] if review["status"] == "approved" else (review["stagingDemoUrl"] if args.demo_review_link else None)
    if link:
        label = "approved write-review link" if review["status"] == "approved" else "STAGING DEMO stand-in (Google search panel)"
        print(f"5/5 googleReviewLink = {label}:", call(base, "PUT", f"/clinics/{cid}", token, {"googleReviewLink": link})[0])
    else:
        print("5/5 googleReviewLink not set (placeholder; pass --demo-review-link for the staging demo)")

    _, final = call(base, "GET", f"/clinics/{cid}", token)
    summary = {k: (final or {}).get(k) for k in ("id", "slug", "status", "plan", "appTitle", "logoUrl", "faviconUrl",
                                                 "whatsappNumber", "phone", "customDomain", "googleReviewLink")}
    (OUT / "staging-clinic.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print("\nDone:", json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
