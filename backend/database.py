"""SQLite connection and schema for employees and users."""
import random
from pathlib import Path

import aiosqlite

DB_PATH = Path(__file__).resolve().parent / "data" / "attrition.db"


async def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                job_role TEXT NOT NULL,
                income REAL NOT NULL,
                years_at_company INTEGER NOT NULL,
                satisfaction INTEGER NOT NULL,
                work_life_balance INTEGER NOT NULL,
                overtime INTEGER NOT NULL,
                attrition_risk REAL,
                risk_level TEXT,
                department TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS prediction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                age INTEGER NOT NULL,
                monthly_income REAL NOT NULL,
                department TEXT,
                gender TEXT,
                job_role TEXT NOT NULL,
                overtime INTEGER NOT NULL,
                job_satisfaction INTEGER,
                work_life_balance INTEGER,
                environment_satisfaction INTEGER,
                years_at_company INTEGER NOT NULL,
                distance_from_home REAL,
                probability REAL NOT NULL,
                risk_level TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
            """
        )
        await db.commit()


def seed_rows():
    """Return list of (name, age, job_role, income, years, sat, wlb, ot, dept) tuples."""
    roles = [
        "Healthcare Representative",
        "Human Resources",
        "Laboratory Technician",
        "Manager",
        "Manufacturing Director",
        "Research Director",
        "Research Scientist",
        "Sales Executive",
        "Sales Representative",
    ]
    departments = ["Sales", "R&D", "HR", "Manufacturing", "Healthcare"]
    random.seed(42)
    names = [
        "Alex Rivera",
        "Jordan Kim",
        "Sam Patel",
        "Taylor Chen",
        "Morgan Lee",
        "Casey Wu",
        "Riley Singh",
        "Quinn Foster",
        "Avery Brooks",
        "Jamie Ortiz",
        "Drew Martinez",
        "Reese Johnson",
        "Skyler Adams",
        "Blake Turner",
        "Cameron Diaz",
        "Dakota Ellis",
        "Emery Gray",
        "Finley Hayes",
        "Harper Ingram",
        "Indigo James",
    ]
    rows = []
    for name in names:
        age = random.randint(22, 58)
        role = random.choice(roles)
        income = round(random.uniform(2500, 15000), 2)
        years = random.randint(0, 25)
        sat = random.randint(1, 5)
        wlb = random.randint(1, 5)
        ot = random.choice([0, 0, 1])
        dept = random.choice(departments)
        rows.append((name, age, role, income, years, sat, wlb, ot, dept))
    for i in range(30):
        rows.append(
            (
                f"Employee {i + 21}",
                random.randint(22, 58),
                random.choice(roles),
                round(random.uniform(2500, 15000), 2),
                random.randint(0, 25),
                random.randint(1, 5),
                random.randint(1, 5),
                random.choice([0, 1]),
                random.choice(departments),
            )
        )
    return rows
