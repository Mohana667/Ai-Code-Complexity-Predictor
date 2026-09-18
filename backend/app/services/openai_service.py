from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.config import get_settings
from app.models.schemas import (
    ComplexityEstimate,
    StructuralMetrics,
)

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gpt-5.6-luna"
MAX_CODE_CHARS = 8000


def is_configured() -> bool:
    """Check whether OpenAI API is configured."""

    settings = get_settings()

    return bool(settings.OPENAI_API_KEY)


def _build_prompt(
    code: str,
    language: str,
    metrics: StructuralMetrics,
    heuristic: ComplexityEstimate,
) -> str:
    """Build a code-specific OpenAI analysis prompt."""

    source_code = (
        "```"
        + language
        + "\n"
        + code[:MAX_CODE_CHARS]
        + "\n```"
    )

    return (
        "You are a senior software engineer and algorithm "
        "analysis expert.\n\n"

        "Analyze the ACTUAL SOURCE CODE provided below.\n"
        "Your response must be specific to the actual code.\n"
        "Do not provide generic programming explanations.\n\n"

        f"LANGUAGE:\n{language}\n\n"

        "STATIC CODE METRICS:\n"
        f"Lines: {metrics.lines_of_code}\n"
        f"Maximum nesting depth: {metrics.max_nesting_depth}\n"
        f"Loops: {metrics.loop_count}\n"
        f"Maximum nested loop depth: {metrics.nested_loop_depth}\n"
        f"Functions: {metrics.function_count}\n"
        f"Recursive functions: {metrics.recursive_functions}\n"
        f"Recursive calls: {metrics.recursive_call_count}\n"
        f"Conditions: {metrics.conditional_count}\n"
        f"Dependencies: {metrics.dependency_count}\n"
        f"Cyclomatic complexity: {metrics.cyclomatic_complexity}\n"
        f"Memory allocations: {metrics.memory_allocation_count}\n"
        f"Dynamic memory detected: {metrics.dynamic_memory_detected}\n"
        f"Memory nesting depth: {metrics.memory_nesting_depth}\n"
        f"Logarithmic loop detected: {metrics.logarithmic_loop_detected}\n\n"

        "HEURISTIC RESULT:\n"
        f"Time complexity: {heuristic.time_complexity}\n"
        f"Space complexity: {heuristic.space_complexity}\n"
        f"Risk: {heuristic.risk_level.value}\n"
        f"Risk score: {heuristic.risk_score}\n\n"

        "SOURCE CODE:\n"
        f"{source_code}\n\n"

        "YOUR TASK:\n"
        "1. Analyze the actual algorithm in the source code.\n"
        "2. Determine realistic worst-case time complexity.\n"
        "3. Determine auxiliary space complexity.\n"
        "4. Explain the complexity using the actual code.\n"
        "5. Identify actual performance hotspots.\n"
        "6. Identify realistic performance risks.\n"
        "7. Suggest practical optimizations if useful.\n"
        "8. Suggest a better algorithm or data structure if useful.\n"
        "9. Provide optimized code only when meaningful.\n"
        "10. Ensure optimized code preserves functionality.\n"
        "11. Determine optimized time and space complexity.\n"
        "12. Return confidence from 0.0 to 1.0.\n\n"

        "IMPORTANT RULES:\n"
        "- Analyze the actual source code.\n"
        "- Do not blindly assume nested loops are O(n^2).\n"
        "- Consider actual loop bounds.\n"
        "- Consider searching and sorting operations.\n"
        "- Consider data structures used.\n"
        "- Consider recursion and recursive branching.\n"
        "- Do not invent an optimization when none is needed.\n"
        "- Explain findings using the actual code.\n"
        "- Optimized code must be valid for the selected language.\n"
        "- If optimization is not meaningful, return an empty "
        "optimized_code string.\n\n"

        "Return ONLY valid JSON.\n"
        "Do not use markdown or code fences around the JSON.\n\n"

        "Use exactly these fields:\n"
        "{\n"
        '  "time_complexity": "O(...)",\n'
        '  "space_complexity": "O(...)",\n'
        '  "confidence": 0.0,\n'
        '  "code_summary": "...",\n'
        '  "complexity_reason": "...",\n'
        '  "explanation": "...",\n'
        '  "performance_analysis": "...",\n'
        '  "performance_risks": [],\n'
        '  "hotspots": [],\n'
        '  "optimization_suggestions": [],\n'
        '  "better_approach": "...",\n'
        '  "optimized_code": "...",\n'
        '  "optimized_time_complexity": "O(...)",\n'
        '  "optimized_space_complexity": "O(...)"\n'
        "}"
    )


def _safe_string_list(value: Any) -> list[str]:
    """Convert a value into a list of non-empty strings."""

    if not isinstance(value, list):
        return []

    return [
        str(item).strip()
        for item in value
        if str(item).strip()
    ]


def _apply_ai_result(
    heuristic: ComplexityEstimate,
    data: dict[str, Any],
) -> ComplexityEstimate:
    """Merge OpenAI result with the heuristic estimate."""

    try:
        confidence = float(
            data.get(
                "confidence",
                heuristic.confidence,
            )
        )
    except (TypeError, ValueError):
        confidence = heuristic.confidence

    confidence = max(0.0, min(1.0, confidence))

    return ComplexityEstimate(
        time_complexity=str(
            data.get(
                "time_complexity",
                heuristic.time_complexity,
            )
        ).strip(),

        space_complexity=str(
            data.get(
                "space_complexity",
                heuristic.space_complexity,
            )
        ).strip(),

        confidence=confidence,

        risk_level=heuristic.risk_level,
        risk_score=heuristic.risk_score,

        explanation=str(
            data.get(
                "explanation",
                heuristic.explanation,
            )
        ).strip(),

        code_summary=str(
            data.get("code_summary", "")
        ).strip() or heuristic.code_summary,

        complexity_reason=str(
            data.get("complexity_reason", "")
        ).strip() or heuristic.complexity_reason,

        performance_analysis=str(
            data.get("performance_analysis", "")
        ).strip() or heuristic.performance_analysis,

        better_approach=str(
            data.get("better_approach", "")
        ).strip() or heuristic.better_approach,

        performance_risks=(
            _safe_string_list(
                data.get("performance_risks", [])
            )
            or heuristic.performance_risks
        ),

        hotspots=(
            _safe_string_list(
                data.get("hotspots", [])
            )
            or heuristic.hotspots
        ),

        optimization_suggestions=(
            _safe_string_list(
                data.get("optimization_suggestions", [])
            )
            or heuristic.optimization_suggestions
        ),

        optimized_code=str(
            data.get("optimized_code", "")
        ).strip(),

        optimized_time_complexity=str(
            data.get("optimized_time_complexity", "")
        ).strip(),

        optimized_space_complexity=str(
            data.get("optimized_space_complexity", "")
        ).strip(),
    )


async def enhance(
    code: str,
    language: str,
    metrics: StructuralMetrics,
    heuristic: ComplexityEstimate,
) -> tuple[ComplexityEstimate, bool]:
    """
    Enhance heuristic analysis using OpenAI.

    Returns:
        (estimate, True) when OpenAI succeeds.
        (heuristic, False) when OpenAI fails.
    """

    settings = get_settings()

    if not settings.OPENAI_API_KEY:
        logger.warning(
            "OpenAI is not configured. "
            "Using heuristic analysis."
        )

        return heuristic, False

    model_name = (
        settings.OPENAI_MODEL.strip()
        if settings.OPENAI_MODEL
        else DEFAULT_MODEL
    )

    if not model_name:
        model_name = DEFAULT_MODEL

    prompt = _build_prompt(
        code=code,
        language=language,
        metrics=metrics,
        heuristic=heuristic,
    )

    try:
        logger.info(
            "Sending code analysis request to OpenAI "
            "using model: %s",
            model_name,
        )

        client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
        )

        response = await asyncio.wait_for(
            client.responses.create(
                model=model_name,
                input=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert programming "
                            "and algorithm analysis assistant."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
            ),
            timeout=90.0,
        )

        text = response.output_text.strip()

        if not text:
            raise ValueError(
                "OpenAI returned an empty response."
            )

        if text.startswith("```json"):
            text = text[7:]

        elif text.startswith("```"):
            text = text[3:]

        if text.endswith("```"):
            text = text[:-3]

        data = json.loads(text.strip())

        if not isinstance(data, dict):
            raise ValueError(
                "OpenAI response is not a JSON object."
            )

        estimate = _apply_ai_result(
            heuristic,
            data,
        )

        logger.info(
            "OpenAI complexity enhancement completed "
            "successfully using %s.",
            model_name,
        )

        return estimate, True

    except Exception as exc:
        logger.warning(
            "OpenAI model %s failed: %s",
            model_name,
            exc,
        )

        logger.warning(
            "Using heuristic complexity analysis "
            "as fallback.",
        )

        return heuristic, False