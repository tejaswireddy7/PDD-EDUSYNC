import json
import joblib
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.models.irt import EduSyncAdaptiveAssessmentEngine

DATASET_DIR = BASE_DIR / "training" / "datasets"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

def main():
    print("Calibrating IRT Adaptive Assessment Model...")
    questions_p = DATASET_DIR / "assessment_questions.json"
    
    with open(questions_p, "r", encoding="utf-8") as f:
        questions_data = json.load(f)

    engine = EduSyncAdaptiveAssessmentEngine()
    engine.fit(questions_data)

    out_path = SAVED_MODELS_DIR / "irt_model.pkl"
    joblib.dump(engine, out_path)
    print(f"Calibrated IRT adaptive engine saved to {out_path}")

if __name__ == "__main__":
    main()
