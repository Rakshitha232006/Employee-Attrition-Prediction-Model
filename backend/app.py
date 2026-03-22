"""
Employee Attrition API — FastAPI + SQLite + scikit-learn model.
"""
from contextlib import asynccontextmanager
import json
from pathlib import Path

import aiosqlite
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import DB_PATH, init_db, seed_rows
from ml_service import predict_attrition
from routes import analytics, auth, chat, employees, history, meta, model, predict, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _seed_employees_if_empty()
    yield


async def _seed_employees_if_empty():
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("SELECT COUNT(*) FROM employees")
        row = await cur.fetchone()
        if row and row[0] > 0:
            return
    for tup in seed_rows():
        name, age, role, income, years, sat, wlb, ot, dept = tup
        out = predict_attrition(
            {
                "age": age,
                "job_role": role,
                "income": income,
                "years_at_company": years,
                "satisfaction": sat,
                "work_life_balance": wlb,
                "overtime": bool(ot),
            }
        )
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                """
                INSERT INTO employees (name, age, job_role, income, years_at_company,
                    satisfaction, work_life_balance, overtime, attrition_risk, risk_level, department)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    age,
                    role,
                    income,
                    years,
                    sat,
                    wlb,
                    ot,
                    out["probability"],
                    out["risk_level"],
                    dept,
                ),
            )
            await db.commit()


app = FastAPI(title="Employee Attrition API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(employees.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(upload.router)
app.include_router(history.router)
app.include_router(meta.router)
app.include_router(model.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/job-roles")
async def job_roles():
    """Job roles from the trained model (matches CSV / training labels)."""
    from ml_service import load_bundle

    b = load_bundle()
    return {"job_roles": b["job_roles"]}


ANALYSIS_JSON = Path(__file__).resolve().parent / "model" / "analysis_summary.json"


@app.get("/api/analysis-summary")
async def analysis_summary():
    """Training summary (feature lists, accuracy, paths) from `train_model.py`."""
    if not ANALYSIS_JSON.exists():
        return {"detail": "Run: python model/train_model.py"}
    return json.loads(ANALYSIS_JSON.read_text(encoding="utf-8"))
