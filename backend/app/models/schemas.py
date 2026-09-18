"""Pydantic models shared across routers and services."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Language(str, Enum):
    python = "python"
    java = "java"
    c = "c"
    cpp = "cpp"
    html = "html"
    css = "css"
    javascript = "javascript"
    php = "php"
    typescript = "typescript"


class RiskLevel(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    critical = "critical"


class AnalysisRequest(BaseModel):
    code: str = Field(
        ...,
        min_length=1,
        description="Raw source code to analyze",
    )
    language: Language
    filename: Optional[str] = None
    use_ai_enhancement: bool = True


class StructuralMetrics(BaseModel):
    lines_of_code: int
    max_nesting_depth: int
    loop_count: int
    nested_loop_depth: int
    function_count: int

    recursive_functions: list[str] = []
    recursive_call_count: int = 0

    conditional_count: int
    dependency_count: int
    cyclomatic_complexity: int

    memory_allocation_count: int = 0
    dynamic_memory_detected: bool = False
    memory_nesting_depth: int = 0
    logarithmic_loop_detected: bool = False


class ComplexityEstimate(BaseModel):
    time_complexity: str
    space_complexity: str

    confidence: float

    risk_level: RiskLevel
    risk_score: int

    explanation: str

    # AI detailed analysis
    code_summary: str = ""
    complexity_reason: str = ""
    performance_analysis: str = ""
    better_approach: str = ""

    performance_risks: list[str] = []
    hotspots: list[str] = []
    optimization_suggestions: list[str] = []

    # AI optimization result
    optimized_code: str = ""
    optimized_time_complexity: str = ""
    optimized_space_complexity: str = ""


class AnalysisResponse(BaseModel):
    id: Optional[str] = None

    language: Language
    filename: Optional[str] = None

    metrics: StructuralMetrics
    estimate: ComplexityEstimate

    ai_enhanced: bool

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )

    user_id: Optional[str] = None


class DashboardStats(BaseModel):
    total_analyses: int
    avg_risk_score: float

    risk_distribution: dict[str, int]
    language_distribution: dict[str, int]

    recent_analyses: list[AnalysisResponse] = []


class NotificationPayload(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    url: Optional[str] = None


class PushSubscriptionModel(BaseModel):
    endpoint: str
    keys: dict[str, str]


class UserProfile(BaseModel):
    uid: str

    email: Optional[str] = None
    display_name: Optional[str] = None

    is_admin: bool = False

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )


class AdminUserSummary(BaseModel):
    uid: str

    email: Optional[str] = None
    display_name: Optional[str] = None

    is_admin: bool = False

    created_at: datetime

    analysis_count: int
    avg_risk_score: float

    last_active: Optional[datetime] = None


class AdminActivityEvent(BaseModel):
    """A single live event broadcast to admin dashboards."""

    type: str = "analysis"

    user_email: Optional[str] = None
    user_id: str

    language: Language
    filename: Optional[str] = None

    time_complexity: str

    risk_level: RiskLevel
    risk_score: int

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )


class AdminOverview(BaseModel):
    total_users: int
    total_analyses: int

    active_users_24h: int

    avg_risk_score: float

    risk_distribution: dict[str, int]
    language_distribution: dict[str, int]

    signups_last_7_days: dict[str, int]

    recent_activity: list[AdminActivityEvent] = []