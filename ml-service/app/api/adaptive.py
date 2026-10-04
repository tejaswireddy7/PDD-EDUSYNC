import joblib
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from app.schemas import (
    NextQuestionRequest,
    NextQuestionResponse,
    SubmitAnswerRequest,
    AbilityEvaluationResponse
)

router = APIRouter(prefix="/api/v1/adaptive", tags=["Adaptive Assessments (IRT)"])

SAVED_MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "saved_models"

def get_irt_engine():
    model_path = SAVED_MODELS_DIR / "irt_model.pkl"
    if not model_path.exists():
        raise HTTPException(
            status_code=503,
            detail="IRT engine is not calibrated yet. Run training pipeline first."
        )
    return joblib.load(model_path)

@router.post("/next-question", response_model=NextQuestionResponse)
def get_next_question(payload: NextQuestionRequest, engine=Depends(get_irt_engine)):
    """
    Selects the next optimal question that maximizes Fisher Information (diagnostic power)
    based on the student's current estimated ability theta.
    """
    answered_set = set(payload.answered_question_ids)
    q = engine.select_next_question(
        domain=payload.domain,
        current_theta=payload.current_theta,
        answered_ids=answered_set
    )

    if not q:
        return {
            "status": "completed",
            "question": None,
            "message": "All diagnostic questions for this domain have been completed."
        }

    return {
        "status": "in_progress",
        "question": q,
        "message": "Optimal diagnostic question selected."
    }

@router.post("/evaluate-ability", response_model=AbilityEvaluationResponse)
def evaluate_ability(payload: SubmitAnswerRequest, engine=Depends(get_irt_engine)):
    """
    Calculates Bayesian Expected A Posteriori (EAP) ability estimation (theta)
    and maps it to 0-100% mastery percentile and suggested curriculum level.
    """
    responses_list = [r.model_dump() for r in payload.responses]
    theta, se = engine.estimate_ability_eap(responses_list)
    mastery = engine.convert_theta_to_mastery_percentile(theta)

    rec_diff = "Beginner" if theta < -0.3 else ("Intermediate" if theta < 0.9 else "Advanced")

    return {
        "user_id": payload.user_id or "anon",
        "theta_score": theta,
        "standard_error": se,
        "mastery_percentile": mastery["mastery_percentile"],
        "grade": mastery["grade"],
        "recommended_difficulty": rec_diff
    }
