from __future__ import annotations

from pathlib import Path

from .db_reader import connect


def wipe_user_data(db_path: Path, telegram_id: int) -> None:
    """Delete one Telegram user's rows. No-op if the database file is missing."""
    if not db_path.exists():
        return

    with connect(db_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        apartments = [
            row["id"]
            for row in connection.execute(
                "SELECT id FROM apartments WHERE telegram_id = ?",
                (telegram_id,),
            ).fetchall()
        ]
        services: list[str] = []
        if apartments:
            placeholders = ",".join("?" for _ in apartments)
            services = [
                row["id"]
                for row in connection.execute(
                    f"SELECT id FROM services WHERE apartment_id IN ({placeholders})",
                    apartments,
                ).fetchall()
            ]
        meters: list[str] = []
        if services:
            placeholders = ",".join("?" for _ in services)
            meters = [
                row["id"]
                for row in connection.execute(
                    f"SELECT id FROM meters WHERE service_id IN ({placeholders})",
                    services,
                ).fetchall()
            ]
        if meters:
            placeholders = ",".join("?" for _ in meters)
            connection.execute(
                f"DELETE FROM readings WHERE meter_id IN ({placeholders})",
                meters,
            )
        if services:
            placeholders = ",".join("?" for _ in services)
            connection.execute(
                f"DELETE FROM meters WHERE service_id IN ({placeholders})",
                services,
            )
        if apartments:
            placeholders = ",".join("?" for _ in apartments)
            connection.execute(
                f"DELETE FROM charges WHERE apartment_id IN ({placeholders})",
                apartments,
            )
            connection.execute(
                f"DELETE FROM payments WHERE apartment_id IN ({placeholders})",
                apartments,
            )
            connection.execute(
                f"DELETE FROM services WHERE apartment_id IN ({placeholders})",
                apartments,
            )
        connection.execute("DELETE FROM apartments WHERE telegram_id = ?", (telegram_id,))
        connection.execute("DELETE FROM users WHERE telegram_id = ?", (telegram_id,))
        connection.commit()
