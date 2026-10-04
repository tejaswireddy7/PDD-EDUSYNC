import json
import joblib
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.models.recommender import EduSyncHybridRecommender

DATASET_DIR = BASE_DIR / "training" / "datasets"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

def main():
    print("Training Hybrid Course Recommender & Career Matcher...")
    
    courses_p = DATASET_DIR / "courses.json"
    jobs_p = DATASET_DIR / "jobs.json"
    users_p = DATASET_DIR / "users.json"
    interactions_p = DATASET_DIR / "user_interactions.json"

    with open(courses_p, "r", encoding="utf-8") as f:
        courses_data = json.load(f)
    with open(jobs_p, "r", encoding="utf-8") as f:
        jobs_data = json.load(f)
    with open(users_p, "r", encoding="utf-8") as f:
        users_data = json.load(f)
    with open(interactions_p, "r", encoding="utf-8") as f:
        interactions_data = json.load(f)

    model = EduSyncHybridRecommender()
    model.fit(courses_data, jobs_data, users_data, interactions_data)

    out_path = SAVED_MODELS_DIR / "recommender_model.pkl"
    joblib.dump(model, out_path)
    print(f"Trained recommendation model saved to {out_path}")

if __name__ == "__main__":
    main()
