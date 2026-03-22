import aiosqlite
from fastapi import APIRouter
from pydantic import BaseModel, Field

from database import DB_PATH
from ml_service import predict_attrition

router = APIRouter(tags=["predict"])


class PredictIn(BaseModel):
    age: int = Field(..., ge=18, le=70)
    job_role: str
    income: float = Field(..., gt=0)
    years_at_company: int = Field(..., ge=0, le=50)
    satisfaction: int = Field(..., ge=1, le=5)
    work_life_balance: int = Field(..., ge=1, le=5)
    environment_satisfaction: int = Field(3, ge=1, le=5)
    overtime: bool
    department: str = ""
    gender: str = ""
    distance_from_home: int = Field(10, ge=0, le=100)


@router.post("/predict")
async def predict(body: PredictIn):
    payload = body.model_dump()
    result = predict_attrition(payload)

    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                """
                INSERT INTO prediction_history (
                    age, monthly_income, department, gender, job_role,
                    overtime, job_satisfaction, work_life_balance,
                    environment_satisfaction, years_at_company, distance_from_home,
                    probability, risk_level
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    int(payload["age"]),
                    float(payload["income"]),
                    payload.get("department") or None,
                    payload.get("gender") or None,
                    str(payload["job_role"]),
                    1 if payload.get("overtime") else 0,
                    int(payload.get("satisfaction", 3)),
                    int(payload.get("work_life_balance", 3)),
                    int(payload.get("environment_satisfaction", 3)),
                    int(payload["years_at_company"]),
                    float(payload.get("distance_from_home", 10)),
                    float(result["probability"]),
                    str(result["risk_level"]),
                ),
            )
            await db.commit()
    except Exception:
        pass

    return result
