from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# User Profile Input Schema
class UserSurveyInput(BaseModel):
    user_id: Optional[str] = "anon_user"
    domain: str = Field(..., example="Frontend")
    level: str = Field(..., example="Intermediate")
    goal: Optional[str] = Field("Career Switch", example="Career Switch")
    pace: Optional[str] = Field("Standard (5-10 hrs/wk)", example="Standard (5-10 hrs/wk)")
    preferred_learning_style: Optional[str] = Field("Hands-on Projects", example="Hands-on Projects")
    skills: List[str] = Field(default_factory=list, example=["HTML", "CSS", "JavaScript", "React"])
    completed_courses: List[str] = Field(default_factory=list, example=["fe-001"])

# Course Recommendation Output
class RecommendedCourseItem(BaseModel):
    course_id: str
    title: str
    domain: str
    difficulty: str
    time_weeks: int
    skills: List[str]
    new_skills_acquired: List[str]
    match_score: float
    ai_reason: str

class CourseRecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[RecommendedCourseItem]
    model_version: str

# Job Gap Output
class BridgingCourse(BaseModel):
    course_id: str
    title: str
    teaches: List[str]

class JobMatchItem(BaseModel):
    job_id: str
    title: str
    domain: str
    experience_level: str
    salary_range: str
    match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommended_bridge_courses: List[BridgingCourse]

class JobMatchResponse(BaseModel):
    user_id: str
    career_matches: List[JobMatchItem]
    model_version: str

# Adaptive Assessment Schemas
class NextQuestionRequest(BaseModel):
    user_id: Optional[str] = "anon"
    domain: str = Field(..., example="Frontend")
    current_theta: float = Field(0.0, example=0.0)
    answered_question_ids: List[str] = Field(default_factory=list)

class QuestionOption(BaseModel):
    id: str
    domain: str
    skill: str
    question: str
    options: List[str]
    difficulty_label: str
    current_estimated_ability: float

class NextQuestionResponse(BaseModel):
    status: str
    question: Optional[QuestionOption] = None
    message: Optional[str] = None

class AssessmentAnswerItem(BaseModel):
    question_id: str
    is_correct: bool

class SubmitAnswerRequest(BaseModel):
    user_id: Optional[str] = "anon"
    domain: str = "Frontend"
    responses: List[AssessmentAnswerItem]

class AbilityEvaluationResponse(BaseModel):
    user_id: str
    theta_score: float
    standard_error: float
    mastery_percentile: float
    grade: str
    recommended_difficulty: str

# Telemetry Schema
class TelemetryEvent(BaseModel):
    user_id: str
    event_type: str = Field(..., example="course_progress") # course_progress | quiz_complete | job_click
    course_id: Optional[str] = None
    domain: Optional[str] = "Frontend"
    progress: Optional[int] = 0
    rating: Optional[int] = None
    completed: Optional[bool] = False
    time_spent_mins: Optional[int] = 0
    metadata: Optional[Dict[str, Any]] = None
