"""
Complexity estimation engine.

Converts StructuralMetrics into:
- Time complexity
- Space complexity
- Confidence
- Risk level
- Risk score
- Optimization suggestions
- Performance hotspots

The estimator is heuristic-based. AI enhancement can refine the
explanation and optimization, while the structural analyzer provides
the measurable baseline.
"""

from __future__ import annotations

from app.models.schemas import (
    StructuralMetrics,
    ComplexityEstimate,
    RiskLevel,
)


# =========================================================
# BIG-O MAPPING
# =========================================================

_BIGO_BY_DEPTH = {
    0: "O(1)",
    1: "O(n)",
    2: "O(n^2)",
    3: "O(n^3)",
}


# =========================================================
# TIME COMPLEXITY
# =========================================================

def _time_complexity(
    metrics: StructuralMetrics,
) -> tuple[str, float]:
    """
    Estimate time complexity.

    Returns:
        (complexity_notation, confidence)
    """

    # -----------------------------------------------------
    # Logarithmic algorithms
    # -----------------------------------------------------

    if metrics.logarithmic_loop_detected:
        return "O(log n)", 1.00

    # -----------------------------------------------------
    # Recursive algorithms
    # -----------------------------------------------------

    if metrics.recursive_functions:

        if metrics.recursive_call_count >= 2:
            return "O(2^n)", 1.00

        return "O(n)", 1.00

    # -----------------------------------------------------
    # Loop / memory nesting
    # -----------------------------------------------------

    depth = max(
        metrics.nested_loop_depth,
        metrics.memory_nesting_depth,
    )

    if depth in _BIGO_BY_DEPTH:
        return _BIGO_BY_DEPTH[depth], 1.00

    # -----------------------------------------------------
    # Deeper nesting
    # -----------------------------------------------------

    return f"O(n^{depth})", 1.00


# =========================================================
# SPACE COMPLEXITY
# =========================================================

def _space_complexity(
    metrics: StructuralMetrics,
) -> str:
    """
    Estimate auxiliary space complexity.
    """

    # -----------------------------------------------------
    # Recursive call stack
    # -----------------------------------------------------

    if metrics.recursive_functions:
        return "O(n)"

    # -----------------------------------------------------
    # Nested dynamic memory
    # -----------------------------------------------------

    if metrics.memory_nesting_depth >= 2:
        return "O(n^2)"

    # -----------------------------------------------------
    # Dynamic memory allocation
    # -----------------------------------------------------

    if metrics.dynamic_memory_detected:
        return "O(n)"

    # -----------------------------------------------------
    # Regular loops do not automatically use O(n) space.
    # -----------------------------------------------------

    return "O(1)"


# =========================================================
# RISK HELPERS
# =========================================================

def _algorithmic_risk_score(
    time_notation: str,
) -> int:
    """
    Base risk score derived primarily from algorithmic
    time complexity.

    This prevents a simple O(n) algorithm with a few
    conditions from incorrectly becoming Moderate risk.
    """

    normalized = (
        time_notation
        .lower()
        .replace(" ", "")
    )

    # -----------------------------------------------------
    # Constant
    # -----------------------------------------------------

    if normalized == "o(1)":
        return 0

    # -----------------------------------------------------
    # Logarithmic
    # -----------------------------------------------------

    if normalized == "o(logn)":
        return 5

    # -----------------------------------------------------
    # Linear
    # -----------------------------------------------------

    if normalized == "o(n)":
        return 10

    # -----------------------------------------------------
    # Linearithmic
    # -----------------------------------------------------

    if "nlogn" in normalized:
        return 25

    # -----------------------------------------------------
    # Quadratic
    # -----------------------------------------------------

    if "n^2" in normalized:
        return 60

    # -----------------------------------------------------
    # Cubic
    # -----------------------------------------------------

    if "n^3" in normalized:
        return 80

    # -----------------------------------------------------
    # Exponential
    # -----------------------------------------------------

    if "2^n" in normalized:
        return 100

    # -----------------------------------------------------
    # Higher polynomial
    # -----------------------------------------------------

    if "n^" in normalized:
        return 90

    return 20


# =========================================================
# RISK
# =========================================================

def _risk(
    time_notation: str,
    metrics: StructuralMetrics,
) -> tuple[RiskLevel, int]:
    """
    Calculate risk level and score.

    Algorithmic complexity is the primary factor.
    Structural complexity only adds risk when it represents
    a genuinely significant concern.
    """

    score = _algorithmic_risk_score(
        time_notation
    )

    # -----------------------------------------------------
    # Recursive algorithms
    # -----------------------------------------------------

    if metrics.recursive_functions:

        score += 10

        if metrics.recursive_call_count >= 2:
            score += 10

    # -----------------------------------------------------
    # Very deep structural nesting
    #
    # Normal if/else nesting should not make O(n) code
    # moderate risk.
    # -----------------------------------------------------

    if metrics.max_nesting_depth > 5:
        score += 10

    # -----------------------------------------------------
    # Very high cyclomatic complexity
    # -----------------------------------------------------

    if metrics.cyclomatic_complexity > 15:
        score += 10

    # -----------------------------------------------------
    # Large nested memory structures
    # -----------------------------------------------------

    if metrics.memory_nesting_depth >= 2:
        score += 10

    score = min(
        100,
        score,
    )

    # -----------------------------------------------------
    # Critical
    # -----------------------------------------------------

    if (
        score >= 85
        or "2^n" in time_notation
        or "n^3" in time_notation
    ):
        level = RiskLevel.critical

    # -----------------------------------------------------
    # High
    # -----------------------------------------------------

    elif (
        score >= 50
        or "n^2" in time_notation
    ):
        level = RiskLevel.high

    # -----------------------------------------------------
    # Moderate
    # -----------------------------------------------------

    elif score >= 25:
        level = RiskLevel.moderate

    # -----------------------------------------------------
    # Low
    # -----------------------------------------------------

    else:
        level = RiskLevel.low

    return level, score


# =========================================================
# OPTIMIZATION SUGGESTIONS
# =========================================================

def _suggestions(
    metrics: StructuralMetrics,
    time_notation: str,
) -> list[str]:
    """
    Generate optimization suggestions from structural
    characteristics.
    """

    tips: list[str] = []

    # -----------------------------------------------------
    # Triple nested loops
    # -----------------------------------------------------

    if metrics.nested_loop_depth >= 3:

        tips.append(
            "Triple-nested loops detected — "
            "consider a hash-map lookup, set-based lookup, "
            "or precomputation to reduce repeated work."
        )

    # -----------------------------------------------------
    # Double nested loops
    # -----------------------------------------------------

    elif metrics.nested_loop_depth == 2:

        tips.append(
            "Nested loops detected — "
            "check whether a single pass with a set or "
            "dictionary can replace repeated comparisons."
        )

    # -----------------------------------------------------
    # Recursion
    # -----------------------------------------------------

    if metrics.recursive_functions:

        tips.append(
            f"Recursive function(s) "
            f"{', '.join(metrics.recursive_functions)} — "
            "consider memoization or an iterative approach "
            "when repeated subproblems are present."
        )

    # -----------------------------------------------------
    # High cyclomatic complexity
    # -----------------------------------------------------

    if metrics.cyclomatic_complexity > 15:

        tips.append(
            "High cyclomatic complexity — "
            "consider breaking the logic into smaller "
            "functions to improve maintainability."
        )

    # -----------------------------------------------------
    # Deep nesting
    # -----------------------------------------------------

    if metrics.max_nesting_depth > 5:

        tips.append(
            "Deep nesting detected — "
            "consider early returns, guard clauses, "
            "or smaller helper functions."
        )

    # -----------------------------------------------------
    # No major optimization issue
    # -----------------------------------------------------

    if not tips:

        if time_notation in {
            "O(1)",
            "O(log n)",
            "O(n)",
        }:
            tips.append(
                "No major structural red flags — "
                "the current implementation is already "
                "reasonably efficient."
            )
        else:
            tips.append(
                "Review the identified complexity and "
                "consider a more efficient algorithm or "
                "data structure where applicable."
            )

    return tips


# =========================================================
# MAIN ESTIMATOR
# =========================================================

def estimate(
    metrics: StructuralMetrics,
) -> ComplexityEstimate:
    """
    Build the complete complexity estimate.
    """

    # -----------------------------------------------------
    # Time
    # -----------------------------------------------------

    time_notation, confidence = _time_complexity(
        metrics
    )

    # -----------------------------------------------------
    # Space
    # -----------------------------------------------------

    space_notation = _space_complexity(
        metrics
    )

    # -----------------------------------------------------
    # Risk
    # -----------------------------------------------------

    risk_level, risk_score = _risk(
        time_notation,
        metrics,
    )

    # -----------------------------------------------------
    # Suggestions
    # -----------------------------------------------------

    suggestions = _suggestions(
        metrics,
        time_notation,
    )

    # -----------------------------------------------------
    # Hotspots
    # -----------------------------------------------------

    hotspots: list[str] = []

    if metrics.nested_loop_depth >= 2:

        hotspots.append(
            f"Nested loops "
            f"(depth {metrics.nested_loop_depth})"
        )

    if metrics.recursive_functions:

        hotspots.extend(
            f"Recursive call: {function_name}"
            for function_name
            in metrics.recursive_functions
        )

    if metrics.memory_nesting_depth >= 2:

        hotspots.append(
            "Nested dynamic memory allocation"
        )

    # -----------------------------------------------------
    # Explanation
    # -----------------------------------------------------

    explanation = (
        f"Detected {metrics.loop_count} loop(s) "
        f"with a maximum loop nesting depth of "
        f"{metrics.nested_loop_depth}, "
        f"{metrics.function_count} function(s) "
        f"({len(metrics.recursive_functions)} recursive), "
        f"and a cyclomatic complexity of "
        f"{metrics.cyclomatic_complexity}. "
        f"The detected structure most closely matches "
        f"{time_notation} time complexity and "
        f"{space_notation} auxiliary space complexity."
    )

    # -----------------------------------------------------
    # Final result
    # -----------------------------------------------------

    return ComplexityEstimate(
        time_complexity=time_notation,
        space_complexity=space_notation,
        confidence=confidence,
        risk_level=risk_level,
        risk_score=risk_score,
        explanation=explanation,
        hotspots=hotspots,
        optimization_suggestions=suggestions,
    )