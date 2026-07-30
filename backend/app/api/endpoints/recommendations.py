"""Camera and lens recommendation endpoint."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.recommendation import RecommendRequest, SystemRecommendationOut
from app.services.recommendation_service import recommend_systems

router = APIRouter(prefix="/recommend", tags=["Recommendations"])


@router.post("", response_model=list[SystemRecommendationOut])
def recommend(body: RecommendRequest) -> list[SystemRecommendationOut]:
    """
    Given imaging requirements, return ranked camera + lens combinations
    from the catalog that satisfy the constraints.
    """
    return recommend_systems(body)
