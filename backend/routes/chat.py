"""Rule-based assistant responses for HR / attrition questions."""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["chat"])


class ChatIn(BaseModel):
    message: str


def _reply(message: str) -> str:
    m = message.lower().strip()
    if not m:
        return "Ask me about attrition risk, retention, or how to interpret dashboard scores."
    if any(k in m for k in ["hello", "hi ", "hey"]):
        return (
            "Hi — I’m your Attrition Insights assistant. I can explain risk levels, "
            "what drives turnover, and how to use the prediction form."
        )
    if "risk" in m and ("high" in m or "meaning" in m or "what" in m):
        return (
            "High risk means predicted probability above 70%. It combines overtime, "
            "satisfaction, pay, tenure, and role signals from the model."
        )
    if "low" in m and "risk" in m:
        return (
            "Low risk is below 30% predicted probability. It suggests stronger retention "
            "signals relative to the training distribution."
        )
    if "medium" in m and "risk" in m:
        return (
            "Medium risk is 30–70%. Prioritize stay interviews and targeted interventions."
        )
    if "confidence" in m:
        return (
            "Confidence reflects how decisive the probability is (closer to 0% or 100% "
            "generally yields higher confidence in this demo)."
        )
    if "shap" in m or "importance" in m or "feature" in m:
        return (
            "Feature importance shows which inputs the forest uses most. The panel also "
            "lists human-readable reasons tied to salary, overtime, and satisfaction."
        )
    if "retention" in m or "keep" in m:
        return (
            "Retention levers: fair pay vs market, sustainable workload, career clarity, "
            "and manager quality. Use recommendations on the prediction screen as a checklist."
        )
    if "overtime" in m:
        return (
            "Overtime is a strong positive signal for attrition in many HR datasets. "
            "Reducing sustained overtime often lowers risk faster than one-off perks."
        )
    if "salary" in m or "income" in m or "pay" in m:
        return (
            "Below-benchmark pay increases flight risk especially when combined with "
            "high workload or low satisfaction."
        )
    if "dashboard" in m or "kpi" in m:
        return (
            "The dashboard shows totals, high-risk counts, average risk, and retention score. "
            "Charts summarize trends, departments, and satisfaction vs risk."
        )
    return (
        "I can help with risk bands (Low/Medium/High), what drives model scores, and "
        "retention ideas. Try asking about overtime, confidence, or feature importance."
    )


@router.post("/chat")
async def chat(body: ChatIn):
    return {"reply": _reply(body.message)}
