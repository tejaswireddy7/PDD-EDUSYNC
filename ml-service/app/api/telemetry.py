import json
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.schemas import TelemetryEvent

router = APIRouter(prefix="/api/v1/telemetry", tags=["Telemetry & Self-Improvement"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TELEMETRY_LOG_DIR = BASE_DIR / "telemetry_logs"
TELEMETRY_LOG_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/event")
def log_telemetry_event(event: TelemetryEvent):
    """
    Ingests live user learning events (course progress, quiz scores, career clicks)
    for continuous self-improving active learning.
    """
    event_file = TELEMETRY_LOG_DIR / "events.jsonl"
    with open(event_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(event.model_dump()) + "\n")

    return {
        "status": "success",
        "message": "Telemetry logged for continuous model learning."
    }

def background_retrain_task():
    import sys
    sys.path.append(str(BASE_DIR / "training"))
    from training.retrain_pipeline import run_retraining_pipeline
    run_retraining_pipeline()

@router.post("/retrain/trigger")
def trigger_retraining(background_tasks: BackgroundTasks):
    """
    Triggers the continuous model retraining pipeline in the background.
    """
    background_tasks.add_task(background_retrain_task)
    return {
        "status": "initiated",
        "message": "Model retraining pipeline has been triggered in the background."
    }
