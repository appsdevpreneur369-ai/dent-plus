#!/usr/bin/env python3
"""
Runs ONE of the post-visit demo SQL files (qa/staging/post-visit-demo-phaseA.sql / -phaseB.sql, written by
seed-post-visit-demo.py) on the STAGING database. Owner's yes required (given 27 Oct 2026 for the DPC demo).

Credentials are read in memory from Secret Manager (the same secrets the staging API uses: clinicflow-staging-db-url /
-user / -pass) via gcloud and are never printed or written to disk. Each UPDATE's row count is printed; the whole file
runs in one transaction (any error -> rollback). Before and after, the demo appointments' dispatch rows are shown.

    python scripts/staging/run-demo-sql.py qa/staging/post-visit-demo-phaseA.sql
    python scripts/staging/run-demo-sql.py --status      (read-only: show the demo rows)

Live demo (owner's yes, 30 Oct 2026): after "Finalise & end visit" on a booking made with a real WhatsApp number,
bring THAT appointment's post-visit messages forward so they arrive within one job run (every 10 min):

    python scripts/staging/run-demo-sql.py --recent                          (read-only: today's Dent Plus appointments)
    python scripts/staging/run-demo-sql.py --pull-forward <appointment-id>   (thank-you + review request due now)
    python scripts/staging/run-demo-sql.py --pull-forward <appointment-id> --review-reminder   (once the request is SENT)

Only PENDING rows of that one appointment change, and only if it belongs to the Dent Plus clinic. One transaction.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import psycopg2

PROJECT = "sincere-stock-499113-f1"
ROOT = Path(__file__).resolve().parents[2]


def secret(name):
    out = subprocess.run(["gcloud", "secrets", "versions", "access", "latest", f"--secret={name}", f"--project={PROJECT}"],
                         capture_output=True, text=True, shell=sys.platform == "win32")
    if out.returncode != 0:
        sys.exit(f"Cannot read secret {name}: {out.stderr.strip()[:200]}")
    return out.stdout.strip()


def connect():
    url = secret("clinicflow-staging-db-url")
    m = re.match(r"jdbc:postgresql://([^:/?]+)(?::(\d+))?/([^?]+)(?:\?(.*))?", url)
    if not m:
        sys.exit("Unexpected DB URL format (not jdbc:postgresql://...).")
    host, port, db, query = m.group(1), int(m.group(2) or 5432), m.group(3), m.group(4) or ""
    params = dict(kv.split("=", 1) for kv in query.split("&") if "=" in kv)
    conn = psycopg2.connect(host=host, port=port, dbname=db, user=secret("clinicflow-staging-db-user"),
                            password=secret("clinicflow-staging-db-pass"), sslmode=params.get("sslmode", "require"),
                            connect_timeout=20)
    print(f"connected to staging DB ({db})")
    return conn


def show_appointment(conn, appt_id, label):
    with conn.cursor() as c:
        c.execute("""SELECT a.id, a.appointment_date, a.start_time, a.status, t.status, t.scheduled_at, g.request_status,
                            g.request_scheduled_at, g.reminder_status, g.reminder_scheduled_at
                     FROM appointments a
                     LEFT JOIN post_visit_thank_you_dispatch t ON t.appointment_id = a.id
                     LEFT JOIN google_review_dispatch g ON g.appointment_id = a.id
                     WHERE a.id = %s::uuid""", (appt_id,))
        for r in c.fetchall():
            print(f"{label}: appt {str(r[0])[:8]} {r[1]} {r[2]} {r[3]} | thank-you {r[4]} {r[5]} | review {r[6]} {r[7]} | reminder {r[8]} {r[9]}")


def live_demo(args, clinic_id):
    """--recent (read-only) or --pull-forward <id> [--review-reminder] for ONE Dent Plus appointment."""
    conn = connect()
    if args[0] == "--recent":
        with conn.cursor() as c:
            c.execute("""SELECT a.id, a.start_time, a.status, p.first_name, RIGHT(COALESCE(p.phone, ''), 4),
                                t.status, g.request_status, g.reminder_status
                         FROM appointments a JOIN patients p ON p.id = a.patient_id
                         LEFT JOIN post_visit_thank_you_dispatch t ON t.appointment_id = a.id
                         LEFT JOIN google_review_dispatch g ON g.appointment_id = a.id
                         WHERE a.clinic_id = %s::uuid AND a.appointment_date = CURRENT_DATE ORDER BY a.start_time""", (clinic_id,))
            rows = c.fetchall()
        print(f"today's Dent Plus appointments ({len(rows)}):")
        for r in rows:
            print(f"  {r[0]}  {r[1]}  {r[2]:<12} {r[3]:<12} ph …{r[4]}  thank-you {r[5]}  review {r[6]}  reminder {r[7]}")
        conn.close()
        return
    if len(args) < 2 or not re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", args[1]):
        sys.exit("--pull-forward needs an appointment id (uuid); see --recent.")
    appt = args[1]
    with conn.cursor() as c:
        c.execute("SELECT clinic_id FROM appointments WHERE id = %s::uuid", (appt,))
        row = c.fetchone()
    if not row or str(row[0]) != clinic_id:
        sys.exit("Refusing: that appointment is not a Dent Plus appointment on staging.")
    show_appointment(conn, appt, "before")
    if "--review-reminder" in args:
        updates = ["UPDATE google_review_dispatch SET reminder_scheduled_at = NOW() - INTERVAL '1 minute' "
                   "WHERE appointment_id = %s::uuid AND request_status = 'SENT' AND reminder_status = 'PENDING'"]
    else:
        updates = ["UPDATE post_visit_thank_you_dispatch SET scheduled_at = NOW() - INTERVAL '1 minute' "
                   "WHERE appointment_id = %s::uuid AND status = 'PENDING'",
                   "UPDATE google_review_dispatch SET request_scheduled_at = NOW() - INTERVAL '1 minute' "
                   "WHERE appointment_id = %s::uuid AND request_status = 'PENDING'"]
    try:
        with conn.cursor() as c:
            for s in updates:
                c.execute(s, (appt,))
                print(f"  {c.rowcount} row(s): {s.split(' SET ')[0]}")
        conn.commit()
        print("committed: due at the next job run (every 10 min)")
    except Exception as e:
        conn.rollback()
        sys.exit(f"rolled back: {e}")
    show_appointment(conn, appt, "after")
    conn.close()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if sys.argv[1] in ("--recent", "--pull-forward"):
        demo = json.loads((ROOT / "qa" / "staging" / "post-visit-demo.json").read_text(encoding="utf-8"))
        return live_demo(sys.argv[1:], demo["clinicId"])
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    status_only = sys.argv[1] == "--status"
    sql_file = Path(sys.argv[1]).resolve() if not status_only else None
    if not status_only and (sql_file.parent != (ROOT / "qa" / "staging") or not re.fullmatch(r"post-visit-demo-phase[AB]\.sql", sql_file.name)):
        sys.exit("Only qa/staging/post-visit-demo-phaseA.sql or -phaseB.sql may be run with this script.")
    demo = json.loads((ROOT / "qa" / "staging" / "post-visit-demo.json").read_text(encoding="utf-8"))
    ids = [p["appointmentId"] for p in demo["patients"]]

    conn = connect()
    print("status only" if status_only else "running " + sql_file.name)

    def show(label):
        with conn.cursor() as c:
            c.execute("""SELECT a.id, a.appointment_date, a.status, t.status, t.scheduled_at, g.request_status,
                                g.request_scheduled_at, g.reminder_status, g.reminder_scheduled_at, g.clicked_at
                         FROM appointments a
                         LEFT JOIN post_visit_thank_you_dispatch t ON t.appointment_id = a.id
                         LEFT JOIN google_review_dispatch g ON g.appointment_id = a.id
                         WHERE a.id = ANY(%s::uuid[]) ORDER BY a.appointment_date DESC""", (ids,))
            print(f"\n{label}:")
            for r in c.fetchall():
                print("  appt", str(r[0])[:8], r[1], r[2], "| thank-you", r[3], r[4], "| review", r[5], r[6], "| reminder", r[7], r[8], "| clicked", r[9])

    show("before" if not status_only else "now")
    if status_only:
        conn.close()
        return
    statements = [s.strip() for s in re.sub(r"--[^\n]*", "", sql_file.read_text(encoding="utf-8")).split(";") if s.strip()]
    statements = [s for s in statements if s.upper() not in ("BEGIN", "COMMIT")]
    try:
        with conn.cursor() as c:
            for s in statements:
                if not re.match(r"(?is)^UPDATE\s+(appointments|post_visit_thank_you_dispatch|google_review_dispatch)\s", s):
                    raise RuntimeError(f"refusing unexpected statement: {s[:80]}")
                c.execute(s)
                print(f"  {c.rowcount} row(s): {s[:110]}")
        conn.commit()
        print("committed")
    except Exception as e:
        conn.rollback()
        sys.exit(f"rolled back: {e}")
    show("after")
    conn.close()


if __name__ == "__main__":
    main()
