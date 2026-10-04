import joblib
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from app.schemas import (
    UserSurveyInput,
    CourseRecommendationResponse,
    JobMatchResponse,
    RecommendedCourseItem,
    JobMatchItem
)

router = APIRouter(prefix="/api/v1", tags=["Recommendations & Career"])

SAVED_MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "saved_models"

def get_recommender():
    model_path = SAVED_MODELS_DIR / "recommender_model.pkl"
    if not model_path.exists():
        raise HTTPException(
            status_code=503,
            detail="Recommender model is not trained yet. Run training pipeline first."
        )
    return joblib.load(model_path)

@router.post("/recommend/courses", response_model=CourseRecommendationResponse)
def recommend_courses(payload: UserSurveyInput, recommender=Depends(get_recommender)):
    """
    Generates personalized course suggestions learned from user survey,
    current skill set, goals, and collaborative student pathways.
    """
    user_dict = payload.model_dump()
    recs = recommender.recommend_courses(user_dict, top_k=6)
    
    return {
        "user_id": payload.user_id,
        "recommendations": recs,
        "model_version": "v1.2-hybrid-svd"
    }

@router.post("/recommend/jobs", response_model=JobMatchResponse)
def recommend_jobs(payload: UserSurveyInput, recommender=Depends(get_recommender)):
    """
    Analyzes live career profiles against student's acquired skills,
    computes match %, identifies missing skills, and suggests exact courses.
    """
    user_dict = payload.model_dump()
    matches = recommender.match_jobs_and_gaps(user_dict, top_k=5)
    
    return {
        "user_id": payload.user_id,
        "career_matches": matches,
        "model_version": "v1.2-skillgap-lgb"
    }

@router.post("/analyze/survey")
def analyze_survey(payload: UserSurveyInput, recommender=Depends(get_recommender)):
    """
    Analyzes onboarding survey to output personalized learning path,
    recommended starting level, dynamic milestones, and job trajectories.
    """
    user_dict = payload.model_dump()
    courses = recommender.recommend_courses(user_dict, top_k=4)
    jobs = recommender.match_jobs_and_gaps(user_dict, top_k=3)

    return {
        "user_id": payload.user_id,
        "profile_summary": {
            "target_domain": payload.domain,
            "assessed_starting_level": payload.level,
            "learning_pace": payload.pace,
            "recommended_weekly_hours": 8 if "Standard" in payload.pace else (15 if "Intensive" in payload.pace else 4)
        },
        "initial_learning_path": courses,
        "target_career_trajectories": jobs,
        "ai_insight": f"Based on your goal '{payload.goal}' in {payload.domain}, your roadmap is prioritized for maximum job readiness."
    }
