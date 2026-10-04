import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.recommendations import router as recommendations_router
from app.api.adaptive import router as adaptive_router
from app.api.telemetry import router as telemetry_router

SAVED_MODELS_DIR = Path(__file__).resolve().parent.parent / "saved_models"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure models exist on startup, if not train initial baseline
    recommender_model = SAVED_MODELS_DIR / "recommender_model.pkl"
    irt_model = SAVED_MODELS_DIR / "irt_model.pkl"

    if not recommender_model.exists() or not irt_model.exists():
        print("[EduSync ML Engine] Saved models not found. Running initial training pipeline...")
        import sys
        sys.path.append(str(Path(__file__).resolve().parent.parent / "training"))
        from training.retrain_pipeline import run_retraining_pipeline
        run_retraining_pipeline()
    else:
        print("[EduSync ML Engine] Models loaded into memory and ready for low-latency inference.")

    yield
    print("[EduSync ML Engine] Shutting down ML service.")

app = FastAPI(
    title="EduSync AI / ML Intelligence Microservice",
    description="Adaptive Learning, Two-Tower Recommendations, Job-Skill Gap Matching, and IRT Adaptive Testing.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for communication with Node.js Express backend & React Native frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(recommendations_router)
app.include_router(adaptive_router)
app.include_router(telemetry_router)

@app.get("/")
def root():
    return {
        "service": "EduSync AI / ML Service",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
