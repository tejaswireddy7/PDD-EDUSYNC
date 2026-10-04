from fastapi import APIRouter, Query
from typing import Optional
from app.models.resource_curator import curator

router = APIRouter(prefix="/api/v1/resources", tags=["AI Educational Resources"])

@router.get("/curate")
def curate_web_resources(
    domain: str = Query("All", description="Target domain (Frontend, Backend, Mobile, AI, All)"),
    level: str = Query("All levels", description="Proficiency level"),
    resource_type: str = Query("All types", description="Notes, PDF, Slides, Project, All types"),
    query: str = Query("", description="Search term or topic"),
    sort_by: str = Query("Trending", description="Trending, Top rated, Most downloaded")
):
    """
    Dynamically discover, rank, and curate verified educational resources from the web
    based on student requirements and machine learning match scoring.
    """
    items = curator.curate(
        domain=domain,
        level=level,
        resource_type=resource_type,
        query=query,
        sort_by=sort_by
    )
    return {
        "status": "success",
        "count": len(items),
        "domain": domain,
        "resources": items
    }
