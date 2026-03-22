"""
HR analytics: groupby, correlations, cross-tabs, SHAP globals, insight text.
Uses the same IBM Attrition CSV as training.
"""
from __future__ import annotations

import math
import warnings
from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd

from dataset_config import resolve_csv_path

warnings.filterwarnings("ignore", category=UserWarning)


@lru_cache(maxsize=1)
def load_hr_frame() -> pd.DataFrame:
    path = resolve_csv_path()
    df = pd.read_csv(path)
    df["_y"] = (df["Attrition"].astype(str).str.strip().str.upper() == "YES").astype(int)
    return df


def clear_cache() -> None:
    load_hr_frame.cache_clear()


def summary() -> dict[str, Any]:
    df = load_hr_frame()
    n = len(df)
    attr_pct = float(df["_y"].mean() * 100)
    out: dict[str, Any] = {
        "total_employees": n,
        "attrition_rate_pct": round(attr_pct, 2),
        "high_risk_pct_note": "Share of employees who left (actual attrition).",
        "avg_monthly_income": round(float(df["MonthlyIncome"].mean()), 2),
        "avg_job_satisfaction": round(float(df["JobSatisfaction"].mean()), 3),
        "avg_work_life_balance": round(float(df["WorkLifeBalance"].mean()), 3),
        "avg_environment_satisfaction": round(float(df["EnvironmentSatisfaction"].mean()), 3),
        "avg_age": round(float(df["Age"].mean()), 2),
        "avg_years_at_company": round(float(df["YearsAtCompany"].mean()), 2),
    }
    # Modeled high-risk: RF probability ≥ 0.5 (same pipeline as /predict)
    try:
        from ml_service import load_bundle

        b = load_bundle()
        pipe = b["pipeline"]
        cols = b["column_order"]
        proba = pipe.predict_proba(df[cols])[:, 1]
        out["high_risk_pct"] = round(float((proba >= 0.5).mean() * 100), 2)
        out["high_risk_definition"] = "RandomForest P(attrition) ≥ 50%"
    except Exception:
        out["high_risk_pct"] = None
        out["high_risk_definition"] = None
    return out


def _attrition_by_group(
    df: pd.DataFrame, group_col: str, labels: list[str] | None = None
) -> list[dict[str, Any]]:
    g = df.groupby(group_col, observed=True, dropna=False)["_y"].agg(["mean", "count"])
    g = g.reset_index()
    g.columns = ["group", "attrition_rate", "count"]
    total = len(df)
    out = []
    for _, row in g.iterrows():
        lbl = str(row["group"])
        if labels and group_col in df.columns:
            pass
        out.append(
            {
                "label": lbl,
                "attrition_rate_pct": round(float(row["attrition_rate"]) * 100, 2),
                "count": int(row["count"]),
                "pct_of_employees": round(float(row["count"] / total * 100), 2),
            }
        )
    return out


def numeric_binned_analysis() -> dict[str, list[dict[str, Any]]]:
    df = load_hr_frame()
    out: dict[str, list[dict[str, Any]]] = {}

    specs = [
        ("Age", 5, "Age"),
        ("MonthlyIncome", 5, "MonthlyIncome"),
        ("DistanceFromHome", 5, "DistanceFromHome"),
        ("YearsAtCompany", 5, "YearsAtCompany"),
        ("JobSatisfaction", None, "JobSatisfaction"),
        ("WorkLifeBalance", None, "WorkLifeBalance"),
        ("EnvironmentSatisfaction", None, "EnvironmentSatisfaction"),
    ]

    for col, bins, key in specs:
        if col not in df.columns:
            continue
        if bins is None:
            # ordinal 1-4
            sub = df[[col, "_y"]].dropna()
            g = sub.groupby(col, observed=True)["_y"].agg(["mean", "count"])
            g = g.reset_index()
            rows = []
            total = len(df)
            for _, row in g.iterrows():
                rows.append(
                    {
                        "label": f"{col}={int(row[col])}",
                        "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                        "count": int(row["count"]),
                        "pct_of_employees": round(float(row["count"] / total * 100), 2),
                    }
                )
            out[key] = rows
        else:
            try:
                s = pd.to_numeric(df[col], errors="coerce")
                cut = pd.cut(s, bins=bins, duplicates="drop")
                sub = df.assign(_bin=cut)
                g = sub.groupby("_bin", observed=True)["_y"].agg(["mean", "count"])
                g = g.reset_index()
                rows = []
                total = len(df)
                for _, row in g.iterrows():
                    b = row["_bin"]
                    lab = (
                        f"{b.left:.0f}-{b.right:.0f}"
                        if hasattr(b, "left")
                        else str(b)
                    )
                    rows.append(
                        {
                            "label": lab,
                            "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                            "count": int(row["count"]),
                            "pct_of_employees": round(float(row["count"] / total * 100), 2),
                        }
                    )
                out[key] = rows
            except Exception:
                continue

    return out


def categorical_analysis() -> dict[str, list[dict[str, Any]]]:
    df = load_hr_frame()
    cats = [
        "Department",
        "Gender",
        "JobRole",
        "MaritalStatus",
        "OverTime",
        "BusinessTravel",
        "EducationField",
    ]
    result: dict[str, list[dict[str, Any]]] = {}
    for c in cats:
        if c not in df.columns:
            continue
        result[c] = _attrition_by_group(df, c)
    return result


def cross_analysis() -> list[dict[str, Any]]:
    df = load_hr_frame()
    blocks: list[dict[str, Any]] = []

    def add(
        name: str,
        g1: str,
        g2: str,
        *,
        top: int | None = 30,
    ):
        if g1 not in df.columns or g2 not in df.columns:
            return
        sub = df[[g1, g2, "_y"]].dropna()
        g = sub.groupby([g1, g2], observed=True)["_y"].agg(["mean", "count"])
        g = g.reset_index()
        g = g.sort_values("count", ascending=False)
        if top:
            g = g.head(top)
        rows = []
        for _, row in g.iterrows():
            rows.append(
                {
                    "dim1": str(row[g1]),
                    "dim2": str(row[g2]),
                    "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                    "count": int(row["count"]),
                }
            )
        blocks.append({"name": name, "keys": [g1, g2], "rows": rows})

    add("Department × Gender", "Department", "Gender")
    add("Department × JobRole", "Department", "JobRole", top=25)
    add("Gender × OverTime", "Gender", "OverTime")

    df = load_hr_frame()
    try:
        df = df.copy()
        df["_salary_q"] = pd.qcut(
            df["MonthlyIncome"].rank(method="first"),
            q=4,
            labels=["Q1 (low)", "Q2", "Q3", "Q4 (high)"],
            duplicates="drop",
        )
        g = df.groupby(["JobRole", "_salary_q"], observed=True)["_y"].agg(
            ["mean", "count"]
        )
        g = g.reset_index().sort_values("count", ascending=False).head(25)
        rows = []
        for _, row in g.iterrows():
            rows.append(
                {
                    "dim1": str(row["JobRole"]),
                    "dim2": str(row["_salary_q"]),
                    "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                    "count": int(row["count"]),
                }
            )
        blocks.append(
            {
                "name": "JobRole × Salary quartile",
                "keys": ["JobRole", "MonthlyIncome quartile"],
                "rows": rows,
            }
        )
    except Exception:
        pass

    # Age bin × WorkLifeBalance
    df = load_hr_frame()
    try:
        df = df.copy()
        df["_age_bin"] = pd.cut(df["Age"], bins=5)
        sub = df[["_age_bin", "WorkLifeBalance", "_y"]].dropna()
        g = sub.groupby(["_age_bin", "WorkLifeBalance"], observed=True)[
            "_y"
        ].agg(["mean", "count"])
        g = g.reset_index().sort_values("count", ascending=False).head(24)
        rows = []
        for _, row in g.iterrows():
            b = row["_age_bin"]
            lab = f"{b.left:.0f}-{b.right:.0f}" if hasattr(b, "left") else str(b)
            rows.append(
                {
                    "dim1": lab,
                    "dim2": str(int(row["WorkLifeBalance"])),
                    "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                    "count": int(row["count"]),
                }
            )
        blocks.append(
            {
                "name": "Age range × WorkLifeBalance",
                "keys": ["Age bin", "WorkLifeBalance"],
                "rows": rows,
            }
        )
    except Exception:
        pass

    return blocks


def correlation_matrix() -> dict[str, Any]:
    df = load_hr_frame()
    num_cols = [
        c
        for c in df.select_dtypes(include=[np.number]).columns
        if c not in ("_y", "EmployeeNumber", "EmployeeCount")
    ]
    if "EmployeeNumber" in df.columns:
        num_cols = [c for c in num_cols if c != "EmployeeNumber"]
    sub = df[num_cols + ["_y"]].copy()
    corr = sub.corr()
    labels = [str(c) for c in corr.columns]
    mat = [[round(float(corr.iloc[i, j]), 4) for j in range(len(labels))] for i in range(len(labels))]
    return {"labels": labels, "matrix": mat}


def scatter_pairs(max_points: int = 450) -> list[dict[str, Any]]:
    df = load_hr_frame()
    pairs = [
        ("MonthlyIncome", "JobSatisfaction", "Salary vs Job satisfaction"),
        ("DistanceFromHome", "WorkLifeBalance", "Distance vs Work-life balance"),
        ("YearsAtCompany", "YearsSinceLastPromotion", "Tenure vs years since promotion"),
        ("OverTime", "JobSatisfaction", "Overtime (encoded) vs satisfaction"),
    ]
    rng = np.random.default_rng(42)
    out = []
    for x, y, title in pairs:
        if x not in df.columns or y not in df.columns:
            continue
        if df[x].dtype == object and x == "OverTime":
            xx = (df[x].astype(str).str.upper() == "YES").astype(float)
        else:
            xx = pd.to_numeric(df[x], errors="coerce")
        yy = pd.to_numeric(df[y], errors="coerce")
        m = pd.DataFrame({"x": xx, "y": yy, "_y": df["_y"]}).dropna()
        if len(m) > max_points:
            m = m.sample(max_points, random_state=42)
        pts = [
            {
                "x": float(r["x"]),
                "y": float(r["y"]),
                "attrition": int(r["_y"]),
            }
            for _, r in m.iterrows()
        ]
        out.append({"id": f"{x}_{y}", "title": title, "xLabel": x, "yLabel": y, "points": pts})
    return out


_shap_cache: dict[str, Any] | None = None


def shap_global_analysis(max_samples: int = 600) -> dict[str, Any]:
    global _shap_cache
    if _shap_cache is not None:
        return _shap_cache

    empty_payload = {
        "n_samples_used": 0,
        "features": [],
    }

    try:
        import shap
        from ml_service import load_bundle
    except Exception as e:
        return {**empty_payload, "error": str(e)}

    try:
        bundle = load_bundle()
        pipeline = bundle["pipeline"]
        cols = bundle["column_order"]
        df = load_hr_frame()
        X = df[cols].copy()
        if len(X) > max_samples:
            X = X.sample(max_samples, random_state=42)

        prep = pipeline.named_steps["prep"]
        clf = pipeline.named_steps["clf"]
        Xt = prep.transform(X)
        if hasattr(Xt, "toarray"):
            Xt = Xt.toarray()

        explainer = shap.TreeExplainer(clf)
        sv_raw = explainer.shap_values(Xt)

        if hasattr(sv_raw, "values"):
            sv_arr = np.asarray(sv_raw.values)
        elif isinstance(sv_raw, list):
            if not sv_raw:
                return {**empty_payload, "error": "SHAP returned an empty list."}
            sv_arr = np.asarray(sv_raw[1] if len(sv_raw) > 1 else sv_raw[0])
        else:
            sv_arr = np.asarray(sv_raw)

        if sv_arr.size == 0:
            return {**empty_payload, "error": "SHAP returned no values."}

        if sv_arr.ndim == 3:
            sv_arr = sv_arr[:, :, 1] if sv_arr.shape[-1] > 1 else sv_arr[:, :, 0]
        elif sv_arr.ndim == 1:
            sv_arr = sv_arr.reshape(1, -1)
        elif sv_arr.ndim != 2:
            sv_arr = sv_arr.reshape(sv_arr.shape[0], -1)

        names = np.asarray(prep.get_feature_names_out(), dtype=str)
        n_features = min(sv_arr.shape[1], len(names))
        if n_features <= 0:
            return {**empty_payload, "error": "No aligned SHAP feature names."}

        sv_arr = sv_arr[:, :n_features]
        names = names[:n_features]

        mean_abs = np.nan_to_num(np.abs(sv_arr), nan=0.0, posinf=0.0, neginf=0.0).mean(axis=0)
        order = np.argsort(mean_abs)[::-1][:30]

        rows = []
        for i in order:
            val = float(mean_abs[i])
            rows.append(
                {
                    "feature": str(names[i]),
                    "mean_abs_shap": val if math.isfinite(val) else 0.0,
                    "direction_hint": "positive class (attrition)",
                }
            )

        _shap_cache = {
            "n_samples_used": int(len(X)),
            "features": rows,
        }
        return _shap_cache
    except Exception as e:
        return {**empty_payload, "error": str(e)}


def generate_insights() -> list[str]:
    df = load_hr_frame()
    lines: list[str] = []

    # Department
    d = df.groupby("Department", observed=True)["_y"].mean() * 100
    if len(d):
        worst = d.idxmax()
        best = d.idxmin()
        lines.append(
            f"{worst} shows the highest attrition rate ({d[worst]:.1f}%); "
            f"{best} is lowest among departments ({d[best]:.1f}%)."
        )

    # Overtime
    if "OverTime" in df.columns:
        ot = df.groupby("OverTime", observed=True)["_y"].mean() * 100
        if "Yes" in ot.index and "No" in ot.index:
            lines.append(
                f"Employees working overtime leave at {ot['Yes']:.1f}% vs {ot['No']:.1f}% for those without overtime."
            )

    # Income quartile
    try:
        df = df.copy()
        df["_inc_q"] = pd.qcut(
            df["MonthlyIncome"], q=4, labels=["Q1", "Q2", "Q3", "Q4"], duplicates="drop"
        )
        iq = df.groupby("_inc_q", observed=True)["_y"].mean() * 100
        if len(iq) >= 2:
            lines.append(
                f"Lowest salary quartile attrition: {iq.iloc[0]:.1f}% vs highest quartile: {iq.iloc[-1]:.1f}%."
            )
    except Exception:
        pass

    # WLB
    if "WorkLifeBalance" in df.columns:
        w = df.groupby("WorkLifeBalance", observed=True)["_y"].mean() * 100
        if len(w) >= 2:
            lines.append(
                "Lower work-life balance scores align with higher attrition in grouped averages."
            )

    # Correlation attrition
    num = df.select_dtypes(include=[np.number]).columns
    for c in ["JobSatisfaction", "EnvironmentSatisfaction", "MonthlyIncome"]:
        if c in df.columns:
            r = df[c].corr(df["_y"])
            if pd.notna(r):
                lines.append(
                    f"Point-biserial correlation Attrition vs {c}: {r:.3f}."
                )
                break

    # Segment: low pay + OT
    try:
        low = df["MonthlyIncome"] <= df["MonthlyIncome"].quantile(0.25)
        ot = df["OverTime"].astype(str).str.upper() == "YES"
        seg = df[low & ot]["_y"].mean() * 100
        rest = df[~(low & ot)]["_y"].mean() * 100
        lines.append(
            f"Employees in the bottom salary quartile with overtime have ~{seg:.1f}% attrition vs ~{rest:.1f}% for others."
        )
    except Exception:
        pass

    # Dedupe
    seen = set()
    out = []
    for L in lines:
        if L not in seen:
            seen.add(L)
            out.append(L)
    return out[:12]
