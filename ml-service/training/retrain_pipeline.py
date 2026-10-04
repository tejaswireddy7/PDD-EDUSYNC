import json
import os
import shutil
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "datasets"
SAVED_MODELS_DIR = BASE_DIR.parent / "saved_models"
TELEMETRY_LOG_DIR = BASE_DIR.parent / "telemetry_logs"
TELEMETRY_LOG_DIR.mkdir(parents=True, exist_ok=True)

def run_retraining_pipeline():
    """
    Ingests live telemetry logs, updates user interaction matrices,
    retrains recommendation & IRT models, and versions the output.
    """
    print(f"[{datetime.now().isoformat()}] Starting EduSync Continuous Retraining Pipeline...")

    # 1. Ingest new telemetry events if available
    telemetry_file = TELEMETRY_LOG_DIR / "events.jsonl"
    interaction_file = DATASET_DIR / "user_interactions.json"

    if telemetry_file.exists() and interaction_file.exists():
        new_events = []
        with open(telemetry_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    try:
                        new_events.append(json.loads(line.strip()))
                    except Exception:
                        pass

        if new_events:
            print(f"Ingesting {len(new_events)} new user interaction telemetry events...")
            with open(interaction_file, "r", encoding="utf-8") as f:
                existing_interactions = json.load(f)

            # Map telemetry events to training interaction format
            for ev in new_events:
                existing_interactions.append({
                    "user_id": ev.get("user_id", "anon"),
                    "course_id": ev.get("course_id", "fe-001"),
                    "domain": ev.get("domain", "Frontend"),
                    "progress": ev.get("progress", 50),
                    "rating": ev.get("rating", 4),
                    "completed": ev.get("completed", False),
                    "time_spent_mins": ev.get("time_spent_mins", 30)
                })

            with open(interaction_file, "w", encoding="utf-8") as f:
                json.dump(existing_interactions, f, indent=2)

            # Archive processed telemetry
            archive_path = TELEMETRY_LOG_DIR / f"events_archived_{int(datetime.now().timestamp())}.jsonl"
            shutil.move(telemetry_file, archive_path)
            print(f"Archived ingested events to {archive_path.name}")

    # 2. Retrain Recommender Model
    import train_recommender
    train_recommender.main()

    # 3. Retrain / Calibrate IRT Assessment Model
    import train_irt
    train_irt.main()

    # 4. Write Retraining Metadata Manifest
    manifest = {
        "last_trained_at": datetime.now().isoformat(),
        "recommender_version": "v1.2-hybrid",
        "irt_version": "v1.1-2pl",
        "status": "ready"
    }
    with open(SAVED_MODELS_DIR / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"[{datetime.now().isoformat()}] Pipeline finished successfully. Models are up-to-date!")

if __name__ == "__main__":
    run_retraining_pipeline()
