from pydantic import BaseModel
from typing import List, Optional, Any

class UserProfile(BaseModel):
    full_name: str
    age: int
    lifestyle: str
    conditions: List[str]
    income: str
    city: str

class ComparisonItem(BaseModel):
    policy_name: str
    insurer: str
    premium: str
    cover_amount: str
    waiting_period: str
    key_benefit: str
    suitability_score: Any

class CoverageDetails(BaseModel):
    inclusions: str
    exclusions: str
    sub_limits: str
    copay: str
    claim_type: str

class RecommendationResponse(BaseModel):
    comparison_table: List[ComparisonItem]
    coverage_details: CoverageDetails
    why_this_policy: str
