import sqlite3
import psycopg2
import json
import hashlib
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).resolve().parent / '.env')
pg_url = os.getenv("DATABASE_URL", "postgresql://pterodactyl:Anubhav_Cycle_24_United69@46.247.108.191:30182/postgres")
sqlite_path = Path(__file__).resolve().parent.parent / "cadastral.db"

print(f"Connecting to SQLite: {sqlite_path}")
sqlite_conn = sqlite3.connect(sqlite_path)
sqlite_cur = sqlite_conn.cursor()

print(f"Connecting to PostgreSQL...")
pg_conn = psycopg2.connect(pg_url)
pg_cur = pg_conn.cursor()

tables_order = [
    'users',
    'underground_assets',
    'gnss_stations',
    'validation_results',
    'parcels',
    'buildings',
    'floors',
    'vertical_parcels',
    'properties',
]

for tbl in tables_order:
    sqlite_cur.execute(f"PRAGMA table_info({tbl})")
    col_info = sqlite_cur.fetchall()
    col_names = [c[1] for c in col_info]

    sqlite_cur.execute(f"SELECT * FROM {tbl}")
    rows = sqlite_cur.fetchall()

    # Truncate in postgres
    pg_cur.execute(f"TRUNCATE TABLE {tbl} CASCADE;")

    placeholders = ", ".join(["%s"] * len(col_names))
    cols_str = ", ".join(col_names)
    insert_sql = f"INSERT INTO {tbl} ({cols_str}) VALUES ({placeholders})"

    migrated_count = 0
    for r in rows:
        val_list = []
        for val in r:
            val_list.append(val)
        pg_cur.execute(insert_sql, tuple(val_list))
        migrated_count += 1

    try:
        pg_cur.execute(f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), coalesce((SELECT max(id) FROM {tbl}), 1));")
    except Exception:
        pass

    print(f"  [OK] Migrated {tbl}: {migrated_count} records")

# Ensure pending admin Er. Amit Sharma is present
pg_cur.execute("SELECT email FROM users WHERE email = 'sharma.admin@gmail.com';")
if not pg_cur.fetchone():
    h_pwd = hashlib.sha256("AdminPass@2026".encode("utf-8")).hexdigest()
    pg_cur.execute(
        """INSERT INTO users (user_id, email, name, hashed_password, role, status, organization, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s);""",
        ("ADM-0003", "sharma.admin@gmail.com", "Er. Amit Sharma", h_pwd, "admin", "pending", "Town Planning & Geospatial Authority", "2026-02-20 10:00:00 UTC")
    )
    print("  [OK] Added pending admin 'Er. Amit Sharma' (for Super Admin approvals review)")

pg_conn.commit()
print("\n--> ALL PREVIOUS DATA & USER ACCOUNTS MIGRATED TO POSTGRESQL SUCCESSFULLY!")

# Print final verification summary
print("\n--- POSTGRESQL CURRENT TABLE COUNTS ---")
for tbl in tables_order:
    pg_cur.execute(f"SELECT COUNT(*) FROM {tbl};")
    cnt = pg_cur.fetchone()[0]
    print(f"  {tbl:20s}: {cnt} rows")

print("\n--- REGISTERED USERS IN POSTGRESQL ---")
pg_cur.execute("SELECT id, user_id, email, name, role, status, organization FROM users ORDER BY id;")
for u in pg_cur.fetchall():
    print(f"  ID {u[0]} | {u[1]:10s} | {u[4]:10s} ({u[5]:8s}) | {u[2]:35s} | {u[3]}")

pg_cur.close()
pg_conn.close()
sqlite_conn.close()
