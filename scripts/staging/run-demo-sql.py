#!/usr/bin/env python3
"""
Runs ONE of the post-visit demo SQL files (qa/staging/post-visit-demo-phaseA.sql / -phaseB.sql, written by
seed-post-visit-demo.py) on the STAGING database. Owner's yes required (given 27 Oct 2026 for the DPC demo).

Credentials are read in memory from Secret Manager (the same secrets the staging API uses: clinicflow-staging-db-url /
-user / -pass) via gcloud and are never printed or written to disk. Each UPDATE's row count is printed; the whole file
runs in one transaction (any error -> rollback). Before and after, the demo appointments' dispatch rows are shown.

    python scripts/staging/run-demo-sql.py qa/staging/post-visit-demo-phaseA.sql
    python scripts/staging/run-demo-sql.py --status      (read-only: show the demo rows)
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


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    status_only = sys.argv[1] == "--status"
    sql_file = Path(sys.argv[1]).resolve() if not status_only else None
    if not status_only and (sql_file.parent != (ROOT / "qa" / "staging") or not re.fullmatch(r"post-visit-demo-phase[AB]\.sql", sql_file.name)):
        sys.exit("Only qa/staging/post-visit-demo-phaseA.sql or -phaseB.sql may be run with this script.")
    demo = json.loads((ROOT / "qa" / "staging" / "post-visit-demo.json").read_text(encoding="utf-8"))
    ids = [p["appointmentId"] for p in demo["patients"]]

    url = secret("clinicflow-staging-db-url")
    m = re.match(r"jdbc:postgresql://([^:/?]+)(?::(\d+))?/([^?]+)(?:\?(.*))?", url)
    if not m:
        sys.exit("Unexpected DB URL format (not jdbc:postgresql://...).")
    host, port, db, query = m.group(1), int(m.group(2) or 5432), m.group(3), m.group(4) or ""
    params = dict(kv.split("=", 1) for kv in query.split("&") if "=" in kv)
    conn = psycopg2.connect(host=host, port=port, dbname=db, user=secret("clinicflow-staging-db-user"),
                            password=secret("clinicflow-staging-db-pass"), sslmode=params.get("sslmode", "require"),
                            connect_timeout=20)
    print(f"connected to staging DB ({db}); {'status only' if status_only else 'running ' + sql_file.name}")

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
