"""Load trained pipeline and predict attrition from the simplified API payload."""
from __future__ import annotations

import pickle
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_FILE = MODEL_DIR / "model.pkl"

_bundle: dict[str, Any] | None = None


def load_bundle() -> dict[str, Any]:
    global _bundle
    if _bundle is None:
        if not MODEL_FILE.exists():
            raise FileNotFoundError(
                f"Missing {MODEL_FILE}. Run: python model/train_model.py"
            )
        with open(MODEL_FILE, "rb") as f:
            _bundle = pickle.load(f)
    return _bundle


def ui_scale_to_ibm_1_4(ui_val: int) -> int:
    """Map UI 1–5 sliders to IBM dataset 1–4 satisfaction / WLB scale."""
    s = max(1, min(5, int(ui_val)))
    return max(1, min(4, int(round(1 + (s - 1) * 3 / 4))))


def build_prediction_row(payload: dict, bundle: dict) -> pd.DataFrame:
    """Merge API fields with training defaults; all CSV feature columns included."""
    defaults = bundle["defaults"].copy()
    order = bundle["column_order"]

    row = {k: defaults[k] for k in order}

    row["Age"] = int(payload["age"])
    row["JobRole"] = str(payload.get("job_role", "Research Scientist")).strip()
    row["MonthlyIncome"] = float(payload["income"])
    row["YearsAtCompany"] = int(payload["years_at_company"])
    row["JobSatisfaction"] = ui_scale_to_ibm_1_4(int(payload.get("satisfaction", 3)))
    row["WorkLifeBalance"] = ui_scale_to_ibm_1_4(int(payload.get("work_life_balance", 3)))
    row["OverTime"] = "Yes" if payload.get("overtime") else "No"

    if "Department" in order:
        row["Department"] = str(payload.get("department") or defaults.get("Department", ""))
    if "Gender" in order:
        row["Gender"] = str(payload.get("gender") or defaults.get("Gender", ""))
    if "EnvironmentSatisfaction" in order:
        row["EnvironmentSatisfaction"] = ui_scale_to_ibm_1_4(
            int(payload.get("environment_satisfaction", 3))
        )
    if "DistanceFromHome" in order:
        dfh = payload.get("distance_from_home", defaults.get("DistanceFromHome", 10))
        row["DistanceFromHome"] = int(round(float(dfh)))

    df = pd.DataFrame([row])
    return df[order]


def risk_band(p: float) -> str:
    if p < 0.30:
        return "Low"
    if p <= 0.70:
        return "Medium"
    return "High"


def confidence_from_proba(p: float) -> float:
    return round(float(0.5 + abs(p - 0.5)), 3)


def feature_importance_list(bundle: dict, pipeline) -> list[dict[str, Any]]:
    names = pipeline.named_steps["prep"].get_feature_names_out()
    imp = pipeline.named_steps["clf"].feature_importances_.astype(float)
    order = np.argsort(imp)[::-1]
    out = []
    for i in order[:25]:
        out.append({"feature": str(names[i]), "value": float(imp[i])})
    return out


def _short_feature_name(fn: str) -> str:
    fn = str(fn)
    for p in ("num__", "cat__"):
        if fn.startswith(p):
            fn = fn[len(p) :]
    return fn[:120]


def human_reasons(payload: dict, importance: list[dict]) -> list[str]:
    reasons = []
    if payload.get("overtime"):
        reasons.append(
            "Overtime = Yes — associated with higher attrition in the training set."
        )
    if int(payload.get("satisfaction", 3)) <= 2:
        reasons.append("Low job satisfaction on the UI scale.")
    if int(payload.get("work_life_balance", 3)) <= 2:
        reasons.append("Low work-life balance on the UI scale.")
    income = float(payload.get("income", 5000))
    if income < 4000:
        reasons.append("Monthly income is in a lower band vs many retained employees.")
    if float(payload.get("years_at_company", 1)) < 2:
        reasons.append("Short tenure — higher early turnover risk.")
    for item in importance[:5]:
        reasons.append(
            f"Top split feature: {_short_feature_name(item['feature'])}"
        )
    seen: set[str] = set()
    out: list[str] = []
    for r in reasons:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out[:8]


def recommendations(payload: dict, risk: str) -> list[str]:
    recs = []
    if payload.get("overtime"):
        recs.append("Reduce sustained overtime; cap hours and rebalance workload.")
    if int(payload.get("satisfaction", 3)) <= 3:
        recs.append("Stay interview + clear growth path within 30 days.")
    if int(payload.get("work_life_balance", 3)) <= 3:
        recs.append("Flexible scheduling or no-meeting blocks to improve WLB.")
    if float(payload.get("income", 5000)) < 5500:
        recs.append("Compensation review vs internal and market benchmarks.")
    if float(payload.get("years_at_company", 0)) > 3 and risk != "Low":
        recs.append("Recognition / scope expansion aligned with tenure.")
    if not recs:
        recs.append("Continue regular 1:1s and retention check-ins.")
    return recs[:6]


@lru_cache(maxsize=1)
def _df_probas_cached() -> tuple[pd.DataFrame, np.ndarray]:
    """Full HR frame + vector of P(attrition) — shared by roster and dashboard."""
    from analytics_engine import load_hr_frame

    bundle = load_bundle()
    df = load_hr_frame()
    cols = bundle["column_order"]
    probas = bundle["pipeline"].predict_proba(df[cols])[:, 1].astype(np.float64)
    return df, probas


def clear_prediction_cache() -> None:
    """Call after retraining so roster/dashboard pick up new model + CSV."""
    _df_probas_cached.cache_clear()


def roster_from_dataset(
    q: str | None = None,
    risk: str | None = None,
) -> list[dict[str, Any]]:
    """One row per employee in the IBM HR CSV — model risk + actual Attrition label."""
    df, probas = _df_probas_cached()
    out: list[dict[str, Any]] = []
    qn = (q or "").strip().lower()
    for i in range(len(df)):
        p = float(probas[i])
        rl = risk_band(p)
        if risk and rl != risk:
            continue
        en = int(df["EmployeeNumber"].iloc[i]) if "EmployeeNumber" in df.columns else i + 1
        name = f"Employee {en}"
        department = str(df["Department"].iloc[i]) if "Department" in df.columns else ""
        job_role = str(df["JobRole"].iloc[i])
        age = int(df["Age"].iloc[i])
        income = float(df["MonthlyIncome"].iloc[i])
        years = int(df["YearsAtCompany"].iloc[i])
        sat = int(df["JobSatisfaction"].iloc[i])
        wlb = int(df["WorkLifeBalance"].iloc[i])
        ot = str(df["OverTime"].iloc[i]).strip().upper() == "YES"
        att = str(df["Attrition"].iloc[i]).strip().upper() == "YES"
        if qn:
            ok = (
                qn in name.lower()
                or qn in job_role.lower()
                or qn in department.lower()
                or qn == str(en)
                or qn in str(en)
            )
            if not ok:
                continue
        out.append(
            {
                "id": en,
                "name": name,
                "age": age,
                "job_role": job_role,
                "department": department,
                "income": income,
                "years_at_company": years,
                "satisfaction": sat,
                "work_life_balance": wlb,
                "overtime": ot,
                "attrition_risk": round(p, 6),
                "risk_level": rl,
                "actual_attrition": att,
            }
        )
    out.sort(key=lambda r: r["attrition_risk"], reverse=True)
    return out


def dashboard_stats_from_dataset() -> dict[str, Any]:
    df, probas = _df_probas_cached()
    n = len(df)
    avg_r = float(np.mean(probas))
    high = int(np.sum(probas >= 0.5))
    retention = max(0, min(100, round(100 * (1 - avg_r), 1)))
    return {
        "total_employees": n,
        "high_risk_count": high,
        "avg_attrition_risk": round(avg_r * 100, 2),
        "retention_score": retention,
    }


def dashboard_trends_from_dataset() -> dict[str, Any]:
    """Synthetic cohort series (dataset has no event dates)."""
    df, probas = _df_probas_cached()
    n = len(df)
    k = 8
    if "EmployeeNumber" in df.columns:
        order = np.argsort(df["EmployeeNumber"].values)
    else:
        order = np.arange(n)
    points = []
    for i in range(k):
        chunk = order[i * n // k : (i + 1) * n // k]
        seg = probas[chunk]
        points.append(
            {
                "month": f"Cohort {i + 1}",
                "avg_risk_pct": round(float(seg.mean()) * 100, 2),
                "count": int(len(chunk)),
            }
        )
    return {"points": points}


def dashboard_departments_from_dataset() -> dict[str, Any]:
    df, probas = _df_probas_cached()
    g = (
        pd.DataFrame({"department": df["Department"].values, "p": probas})
        .groupby("department", observed=True)
        .agg(avg_risk=("p", "mean"), cnt=("p", "count"))
        .reset_index()
        .sort_values("avg_risk", ascending=False)
    )
    return {
        "departments": [
            {
                "department": str(r["department"]),
                "avg_risk_pct": round(float(r["avg_risk"]) * 100, 2),
                "count": int(r["cnt"]),
            }
            for _, r in g.iterrows()
        ]
    }


def dashboard_scatter_from_dataset(limit: int = 500) -> dict[str, Any]:
    df, probas = _df_probas_cached()
    rng = np.random.default_rng(42)
    idx = np.arange(len(df))
    if len(idx) > limit:
        idx = rng.choice(idx, size=limit, replace=False)
    points = []
    for i in idx:
        en = int(df["EmployeeNumber"].iloc[i]) if "EmployeeNumber" in df.columns else int(i)
        points.append(
            {
                "satisfaction": int(df["JobSatisfaction"].iloc[i]),
                "work_life_balance": int(df["WorkLifeBalance"].iloc[i]),
                "risk": round(float(probas[i]) * 100, 2),
                "name": f"Employee {en}",
            }
        )
    return {"points": points}


def _shap_local_explanations(
    bundle: dict, pipeline, X: pd.DataFrame, top: int = 18
) -> list[dict[str, Any]]:
    try:
        import shap
    except Exception:
        return []
    try:
        prep = pipeline.named_steps["prep"]
        clf = pipeline.named_steps["clf"]
        Xt = prep.transform(X)
        explainer = shap.TreeExplainer(clf)
        sv_raw = explainer.shap_values(Xt)

        # SHAP output shape varies by version and estimator:
        # - list[class] of (n_samples, n_features)
        # - ndarray (n_samples, n_features)
        # - ndarray (n_samples, n_features, n_classes)
        # - Explanation object with .values
        if hasattr(sv_raw, "values"):
            sv_arr = np.asarray(sv_raw.values)
        elif isinstance(sv_raw, list):
            pos = sv_raw[1] if len(sv_raw) > 1 else sv_raw[0]
            sv_arr = np.asarray(pos)
        else:
            sv_arr = np.asarray(sv_raw)

        if sv_arr.ndim == 1:
            sv_row = sv_arr
        elif sv_arr.ndim == 2:
            sv_row = sv_arr[0]
        elif sv_arr.ndim == 3:
            if sv_arr.shape[-1] > 1:
                # common shape: (n_samples, n_features, n_classes)
                sv_row = sv_arr[0, :, 1]
            else:
                sv_row = sv_arr[0, :, 0]
        else:
            return []

        sv_row = np.asarray(sv_row, dtype=float).ravel()
        names = prep.get_feature_names_out()
        if sv_row.size == 0:
            return []
        limit = min(top, sv_row.size, len(names))
        order_idx = np.argsort(np.abs(sv_row))[::-1][:limit]
        out = []
        for i in order_idx:
            val = float(sv_row[i])
            out.append(
                {
                    "feature": str(names[i]),
                    "shap_value": round(val, 6),
                    "effect": "increases_risk" if val > 0 else "decreases_risk",
                }
            )
        return out
    except Exception:
        return []


def predict_attrition(payload: dict) -> dict:
    bundle = load_bundle()
    pipeline = bundle["pipeline"]
    X = build_prediction_row(payload, bundle)
    proba = float(pipeline.predict_proba(X)[0][1])
    rl = risk_band(proba)
    conf = confidence_from_proba(proba)

    importance = feature_importance_list(bundle, pipeline)
    reasons = human_reasons(payload, importance)
    recs = recommendations(payload, rl)

    # Pseudo-contributions: normalized top importances
    max_v = importance[0]["value"] if importance else 1.0
    contribs = [
        {"feature": x["feature"], "score": round(x["value"] / (max_v + 1e-9), 4)}
        for x in importance[:12]
    ]

    shap_local = _shap_local_explanations(bundle, pipeline, X)

    return {
        "probability": round(proba, 4),
        "risk_level": rl,
        "confidence": conf,
        "reasons": reasons,
        "recommendations": recs,
        "feature_importance": [
            {"feature": x["feature"], "value": round(x["value"], 6)}
            for x in importance[:20]
        ],
        "contributions": contribs,
        "shap_explanations": shap_local,
    }
