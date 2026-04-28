# Employee Attrition Prediction Model

A full-stack HR analytics application that predicts employee attrition risk, estimates burnout, analyzes sentiment, simulates retention policies, and provides workforce intelligence insights.

The platform is designed as a practical demo and portfolio project with a production-oriented architecture:

- Backend API with FastAPI + Python
- Frontend dashboard with React + Vite + Tailwind CSS
- ML pipeline for attrition classification and explainability
- HR analytics modules for forecasting, simulation, and organizational network risk

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [How It Works](#how-it-works)
5. [Getting Started](#getting-started)
6. [API Reference](#api-reference)
7. [Frontend Pages](#frontend-pages)
8. [Data and Model Artifacts](#data-and-model-artifacts)
9. [Known Demo Assumptions](#known-demo-assumptions)
10. [Production Hardening Roadmap](#production-hardening-roadmap)

## Features

- Employee attrition prediction with multiple candidate models and best-model selection by ROC-AUC.
- Burnout scoring based on work pattern and satisfaction signals.
- Explainable AI feature importance using SHAP (with fallback when SHAP is unavailable).
- Sentiment analysis of employee feedback text using VADER + TextBlob.
- Department-level attrition forecasting with optional ARIMA/Prophet support.
- Workforce digital twin simulation for policy what-if analysis:
  - salary increase
  - overtime reduction
  - promotion rate adjustment
- Organizational network risk using graph analysis (NetworkX).
- Rule-based HR assistant for natural language Q and A over workforce context.

## Tech Stack

### Backend

- FastAPI, Uvicorn
- Pydantic, pydantic-settings
- pandas, NumPy
- scikit-learn, imbalanced-learn (SMOTE), XGBoost (optional)
- SHAP (explainability)
- statsmodels and Prophet (optional forecasting refinement)
- TextBlob and vaderSentiment (NLP sentiment)
- NetworkX (graph risk)
- joblib (model persistence)

### Frontend

- React 18
- React Router
- Axios
- Recharts
- React Flow
- Vite
- Tailwind CSS + PostCSS + Autoprefixer

## Project Structure

```text
Employee_Attrition_Prediction_Model/
	backend/                       # FastAPI app + ML/analytics modules
		app.py                       # API entrypoint
		train_model.py               # model training script
		predict.py                   # inference orchestration
		preprocess.py                # feature processing pipeline
		model_loader.py              # lazy model loading/training
		sentiment_analysis.py
		burnout_detection.py
		forecasting.py
		workforce_simulation.py
		network_analysis.py
		hr_ai_agent.py
		schemas.py
		requirements.txt
	frontend/                      # React dashboard
		src/
			App.jsx
			api/api.js                 # API client
			pages/                     # Dashboard, Predictions, Analytics, Simulation
			components/                # charts, forms, widgets
		package.json
	data/
		WA_Fn-UseC_-HR-Employee-Attrition.csv
	models/                        # serialized model artifacts (.pkl)
	outputs/
		reports/training_report.json
```

## How It Works

1. Data is loaded from the IBM HR dataset.
2. Features are preprocessed with imputation, scaling, and one-hot encoding.
3. Multiple attrition classifiers are trained and evaluated.
4. The best model is persisted and used for API inference.
5. Inference can combine:
   - attrition model probability
   - burnout signal
   - optional sentiment adjustment from feedback text
6. The frontend visualizes model output, forecast data, simulation outcomes, and network impact.

If model files are missing, the backend can auto-train on startup or first use.

## Getting Started

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### 1) Clone and open the project

```bash
git clone <your-repo-url>
cd Employee_Attrition_Prediction_Model
```

### 2) Backend setup

```bash
cd backend
python -m venv .venv
```

Activate virtual environment:

- Windows PowerShell:

```bash
.venv\Scripts\Activate.ps1
```

- macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Optional explicit training:

```bash
python train_model.py
```

Run backend API:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Backend base URL: `http://127.0.0.1:8000`

### 3) Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## API Reference

Base URL: `http://127.0.0.1:8000`

- `GET /health`
  - Service health check.

- `POST /predict`
  - Predict attrition risk for one employee profile.
  - Accepts features such as age, income, overtime, satisfaction, tenure, and optional `feedback_text`.

- `POST /sentiment-analysis`
  - Sentiment scoring for free-text feedback.

- `GET /burnout-score`
  - Burnout score endpoint with query parameters.

- `GET /feature-importance`
  - Global feature importance (SHAP when available).

- `GET /department-forecast`
  - Department attrition forecast for next quarter.

- `POST /simulate-policy`
  - Simulate retention policy impact.

- `GET /network-risk?leaver_id=<id>`
  - Potential influence/risk propagation if an employee exits.

- `POST /hr-chat`
  - Natural language HR assistant response.

FastAPI docs:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Frontend Pages

- Dashboard:
  - KPI overview, forecast chart, feature importance, risk table, HR chat.
- Predictions:
  - Single-employee prediction form, risk gauge, burnout indicator, recommendations.
- Analytics:
  - Risk and attrition visualizations (mix of live and conceptual demo widgets).
- Simulation:
  - Policy sliders and department-level before/after attrition output.
- Workforce Intelligence:
  - Workforce health snapshot, insights, network graph, HR assistant.

## Data and Model Artifacts

Expected dataset path:

- `data/WA_Fn-UseC_-HR-Employee-Attrition.csv`

Optional feedback dataset:

- `data/employee_feedback.csv`

Generated artifacts:

- `models/attrition_model.pkl`
- `models/burnout_model.pkl`
- `models/sentiment_model.pkl`
- `outputs/reports/training_report.json`

If the IBM dataset is not present, synthetic demo data is used so the app remains runnable.

## Known Demo Assumptions

- Some UI cards and analytics values are static/demo placeholders.
- Simulation uses heuristic elasticities (not causal inference).
- Burnout scoring is currently heuristic-driven for responsiveness.
- HR chat is rule-based and context-grounded, not an external LLM integration.

## Production Hardening Roadmap

- Add real HRIS integrations and scheduled batch scoring.
- Persist predictions, timelines, and feedback in a database.
- Add authentication, RBAC, audit logs, and PII governance.
- Add model monitoring, drift detection, and retraining pipelines.
- Introduce robust testing and CI/CD workflows.
- Containerize backend and frontend for cloud deployment.

Demo link : https://dashing-biscuit-8741cf.netlify.app/
