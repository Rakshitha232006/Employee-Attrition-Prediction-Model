from fastapi import APIRouter, HTTPException, Query

from ml_service import (
    dashboard_departments_from_dataset,
    dashboard_scatter_from_dataset,
    dashboard_stats_from_dataset,
    dashboard_trends_from_dataset,
    roster_from_dataset,
)

router = APIRouter(prefix="/api", tags=["employees"])


@router.get("/employees")
async def list_employees(
    q: str | None = Query(None, description="Search name, id, role, or department"),
    risk: str | None = Query(None, description="Low, Medium, High"),
):
    """Roster from the IBM HR CSV (one row per EmployeeNumber) with live model scores."""
    try:
        rows = roster_from_dataset(q=q, risk=risk)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail="Trained model missing. Run: python model/train_model.py",
        ) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"employees": rows}


@router.get("/dashboard/stats")
async def dashboard_stats():
    try:
        return dashboard_stats_from_dataset()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail="Trained model missing. Run: python model/train_model.py",
        ) from e


@router.get("/dashboard/trends")
async def attrition_trends():
    """Cohort-style trend (IBM CSV has no event dates)."""
    try:
        return dashboard_trends_from_dataset()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail="Trained model missing. Run: python model/train_model.py",
        ) from e


@router.get("/dashboard/departments")
async def department_risk():
    try:
        return dashboard_departments_from_dataset()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail="Trained model missing. Run: python model/train_model.py",
        ) from e


@router.get("/dashboard/scatter")
async def satisfaction_scatter():
    try:
        return dashboard_scatter_from_dataset()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail="Trained model missing. Run: python model/train_model.py",
        ) from e
