"""Manual prediction history and aggregates."""
from __future__ import annotations

import aiosqlite
from fastapi import APIRouter, HTTPException, Query

from database import DB_PATH

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/predictions")
async def list_predictions(limit: int = Query(100, ge=1, le=500)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            """
            SELECT * FROM prediction_history
            ORDER BY datetime(created_at) DESC, id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = await cur.fetchall()
        return {"predictions": [dict(r) for r in rows]}


@router.get("/analytics")
async def history_analytics():
    """Aggregates from stored manual predictions."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT COUNT(*) AS c FROM prediction_history")
        total = (await cur.fetchone())["c"]
        if total == 0:
            return {
                "total_predictions": 0,
                "by_department": [],
                "by_gender": [],
                "by_risk": [],
                "by_dept_gender": [],
            }

        cur = await db.execute(
            """
            SELECT department, COUNT(*) AS c, AVG(probability) AS avg_p
            FROM prediction_history
            GROUP BY department
            ORDER BY c DESC
            """
        )
        by_dept = [
            {
                "department": r["department"] or "—",
                "count": r["c"],
                "avg_probability_pct": round(float(r["avg_p"] or 0) * 100, 2),
            }
            for r in await cur.fetchall()
        ]

        cur = await db.execute(
            """
            SELECT gender, COUNT(*) AS c, AVG(probability) AS avg_p
            FROM prediction_history
            GROUP BY gender
            ORDER BY c DESC
            """
        )
        by_gen = [
            {
                "gender": r["gender"] or "—",
                "count": r["c"],
                "avg_probability_pct": round(float(r["avg_p"] or 0) * 100, 2),
            }
            for r in await cur.fetchall()
        ]

        cur = await db.execute(
            """
            SELECT risk_level, COUNT(*) AS c
            FROM prediction_history
            GROUP BY risk_level
            """
        )
        by_risk = [{"risk_level": r["risk_level"], "count": r["c"]} for r in await cur.fetchall()]

        cur = await db.execute(
            """
            SELECT department, gender, COUNT(*) AS c, AVG(probability) AS avg_p
            FROM prediction_history
            GROUP BY department, gender
            ORDER BY c DESC
            LIMIT 40
            """
        )
        by_dg = [
            {
                "department": r["department"] or "—",
                "gender": r["gender"] or "—",
                "count": r["c"],
                "avg_probability_pct": round(float(r["avg_p"] or 0) * 100, 2),
            }
            for r in await cur.fetchall()
        ]

        return {
            "total_predictions": total,
            "by_department": by_dept,
            "by_gender": by_gen,
            "by_risk": by_risk,
            "by_dept_gender": by_dg,
        }
