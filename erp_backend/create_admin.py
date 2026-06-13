#!/usr/bin/env python3
"""Create an admin user directly in the database.

Usage:
  python create_admin.py --name "Administrador" --email admin@erp.com --password "Admin123*"

If the user already exists, this script will promote it to admin.
"""
import argparse
import os
from sqlalchemy import text
from database import SessionLocal
from auth import hash_password, validate_password


def main():
    parser = argparse.ArgumentParser(description="Create or promote an admin user")
    parser.add_argument("--name", required=True, help="Full name of the admin user")
    parser.add_argument("--email", required=True, help="Email of the admin user")
    parser.add_argument("--password", help="Password for the admin user")
    args = parser.parse_args()

    password = args.password or os.environ.get("ADMIN_PASSWORD")
    if not password:
        raise SystemExit("Provide --password or set ADMIN_PASSWORD environment variable.")

    is_valid, msg = validate_password(password)
    if not is_valid:
        raise SystemExit(f"Password validation failed: {msg}")

    db = SessionLocal()
    try:
        email = args.email.strip().lower()
        name = args.name.strip()
        existing = db.execute(
            text("SELECT id FROM core.users WHERE LOWER(email) = LOWER(:email)"),
            {"email": email},
        ).fetchone()

        if existing:
            user_id = existing[0]
            db.execute(
                text("UPDATE core.users SET role = :role, name = :name WHERE id = :id"),
                {"role": "admin", "name": name, "id": user_id},
            )
            db.commit()
            print(f"User already exists. Promoted to admin with id={user_id}.")
            return

        db.execute(
            text(
                "INSERT INTO core.users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)"
            ),
            {
                "name": name,
                "email": email,
                "password_hash": hash_password(password),
                "role": "admin",
            },
        )
        db.commit()
        print("Admin created successfully.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
