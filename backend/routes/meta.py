"""Categorical options from the training dataset (IBM HR)."""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/options")
async def dataset_options():
    try:
        from analytics_engine import load_hr_frame

        df = load_hr_frame()
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    out: dict = {"job_roles": [], "departments": [], "genders": []}
    if "JobRole" in df.columns:
        out["job_roles"] = sorted(df["JobRole"].dropna().astype(str).unique().tolist())
    if "Department" in df.columns:
        out["departments"] = sorted(df["Department"].dropna().astype(str).unique().tolist())
    if "Gender" in df.columns:
        out["genders"] = sorted(df["Gender"].dropna().astype(str).unique().tolist())
    return out
