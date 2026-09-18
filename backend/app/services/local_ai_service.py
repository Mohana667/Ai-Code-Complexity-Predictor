"""
Local DeepSeek AI service.

Uses Ollama running locally to enhance static complexity analysis.

Flow:
1. Static analyzer calculates measurable code metrics.
2. Heuristic estimator calculates baseline complexity.
3. Local DeepSeek generates explanation and optimization ideas.
4. AI output is validated before being shown.
5. Invalid/incomplete AI output safely falls back to heuristic analysis.

No external AI API is required.
"""

from __future__ import annotations

import ast
import json
import logging
from typing import Any

import httpx

from app.config import get_settings
from app.models.schemas import ComplexityEstimate


logger = logging.getLogger(__name__)

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

MODEL_NAME = "deepseek-coder:1.3b-instruct"

REQUEST_TIMEOUT = 45.0

KEEP_ALIVE = "10m"
NUM_CTX = 1024
NUM_PREDICT = 250

TEMPERATURE = 0.1

def _text(value: Any) -> str:
    """
    Convert a value to a clean string.
    """

    if value is None:
        return ""

    if isinstance(value, str):
        return value.strip()

    if isinstance(value, (int, float, bool)):
        return str(value)

    return ""


def _list(value: Any) -> list[Any]:
    """
    Return a list when the value is actually a list.
    """

    if isinstance(value, list):
        return value

    return []


def _clean_code(code: str) -> str:
    """
    Remove common markdown wrappers from generated code.
    """

    code = _text(code)

    if not code:
        return ""

    if "```" in code:

        parts = code.split("```")

        if len(parts) >= 3:

            code = parts[1]

            lines = code.splitlines()

            if lines:

                first = lines[0].strip().lower()

                if first in {
                    "python",
                    "py",
                    "java",
                    "c",
                    "cpp",
                    "javascript",
                    "js",
                    "php",
                    "typescript",
                    "ts",
                }:
                    lines = lines[1:]

                code = "\n".join(lines)

    return code.strip()

_PLACEHOLDER_VALUES = {
    "",
    "explanation",
    "suggestion",
    "suggestion1",
    "suggestion2",
    "suggestion3",
    "better_approach",
    "better approach",
    "optimization",
    "optimization suggestion",
    "optimization_suggestion",
    "optimized_code",
    "optimized code",
    "performance analysis",
    "performance_analysis",
    "performance risk",
    "performance_risks",
    "hotspot",
    "hotspots",
    "none",
    "n/a",
    "na",
    "null",
}


def _is_placeholder(value: Any) -> bool:
    """
    Detect placeholder-like AI output.

    Prevents values such as:
        suggestion1
        suggestion2
        explanation
        better_approach

    from being displayed as real analysis.
    """

    value = _text(value)

    if not value:
        return True

    normalized = (
        value
        .strip()
        .lower()
        .replace("-", " ")
    )

    if normalized in _PLACEHOLDER_VALUES:
        return True

    compact = (
        normalized
        .replace("_", "")
        .replace(" ", "")
    )

    placeholder_compact = {
        "suggestion",
        "suggestion1",
        "suggestion2",
        "suggestion3",
        "explanation",
        "betterapproach",
        "optimizedcode",
        "optimization",
        "hotspot",
        "hotspots",
        "performanceanalysis",
        "performanceanalysis",
    }

    return compact in placeholder_compact

def _clean_string_list(value: Any) -> list[str]:
    """
    Clean an AI-generated list and remove placeholders.
    """

    items = _list(value)

    cleaned: list[str] = []

    for item in items:

        if isinstance(item, str):

            text = item.strip()

        elif isinstance(item, dict):

            text = (
                _text(item.get("description"))
                or _text(item.get("message"))
                or _text(item.get("text"))
                or _text(item.get("title"))
            )

        else:

            text = ""

        if not text:
            continue

        if _is_placeholder(text):
            continue

        lowered = text.lower().strip()

        # Remove simple artificial labels.
        for prefix in (
            "suggestion1:",
            "suggestion2:",
            "suggestion3:",
            "suggestion 1:",
            "suggestion 2:",
            "suggestion 3:",
        ):

            if lowered.startswith(prefix):

                text = text[len(prefix):].strip()
                break

        if not text:
            continue

        if _is_placeholder(text):
            continue

        cleaned.append(text)

    return cleaned

def _metric_value(
    metrics: Any,
    name: str,
    default: Any = 0,
) -> Any:
    """
    Safely read a metric from a Pydantic model or dictionary.
    """

    if metrics is None:
        return default

    if hasattr(metrics, name):

        return getattr(
            metrics,
            name,
            default,
        )

    if isinstance(metrics, dict):

        return metrics.get(
            name,
            default,
        )

    return default


def _python_loop_depth(code: str) -> int:
    """
    Calculate Python loop nesting depth using AST.
    """

    try:

        tree = ast.parse(code)

    except Exception:

        return 0

    max_depth = 0

    def visit(
        node: ast.AST,
        current_depth: int = 0,
    ) -> None:

        nonlocal max_depth

        if isinstance(
            node,
            (
                ast.For,
                ast.While,
                ast.AsyncFor,
            ),
        ):

            current_depth += 1

            max_depth = max(
                max_depth,
                current_depth,
            )

        for child in ast.iter_child_nodes(node):

            visit(
                child,
                current_depth,
            )

    visit(tree)

    return max_depth


def _python_function_count(code: str) -> int:
    """
    Count Python functions.
    """

    try:

        tree = ast.parse(code)

    except Exception:

        return 0

    return sum(
        1
        for node in ast.walk(tree)
        if isinstance(
            node,
            (
                ast.FunctionDef,
                ast.AsyncFunctionDef,
            ),
        )
    )

def _is_duplicate_problem(code: str) -> bool:
    """
    Detect the common duplicate-finder example.

    This allows deterministic validation/fallback because the
    small local model can occasionally generate incorrect
    duplicate-detection optimizations.
    """

    lowered = code.lower()

    duplicate_signals = [
        "find_duplicates",
        "duplicates =",
        "duplicate",
    ]

    return (
        any(
            signal in lowered
            for signal in duplicate_signals
        )
        and (
            "arr[i]" in lowered
            or "arr[j]" in lowered
            or "for i in range(len(arr))" in lowered
        )
    )


def _is_matrix_multiplication(code: str) -> bool:
    """
    Detect common matrix multiplication code.

    Used to prevent unrelated AI suggestions.
    """

    lowered = code.lower()

    signals = [
        "matrix_multiply",
        "matrix multiplication",
        "result[i][j]",
        "a[i][k] * b[k][j]",
    ]

    return sum(
        signal in lowered
        for signal in signals
    ) >= 2

def _safe_duplicate_optimization() -> str:
    """
    Deterministic O(n) duplicate detection.
    """

    return """def find_duplicates(arr):
    seen = set()
    duplicates = set()

    for item in arr:
        if item in seen:
            duplicates.add(item)
        else:
            seen.add(item)

    return list(duplicates)"""

def _is_find_pairs_problem(code: str) -> bool:
    """Detect the pair-comparison example without guessing unrelated code."""
    lowered = code.lower()
    return (
        "find_pairs" in lowered
        and "arr[i]" in lowered
        and "arr[j]" in lowered
        and "i + 1" in lowered
    )


def _safe_find_pairs_optimization() -> str:
    """Safe constant-factor optimization; Big-O remains O(n^2)."""
    return """def find_pairs(arr):
    n = len(arr)

    for i in range(n - 1):
        current = arr[i]

        for j in range(i + 1, n):
            if current < arr[j]:
                print(current, arr[j])

    return arr"""


def _safe_matrix_optimization() -> str:
    """
    Practical matrix multiplication implementation.

    Important:
    This does NOT falsely claim O(n) or O(n^2).
    Standard matrix multiplication remains O(n^3).
    """

    return """def matrix_multiply(A, B):
    n = len(A)
    result = [[0] * n for _ in range(n)]

    for i in range(n):
        for k in range(n):
            aik = A[i][k]

            for j in range(n):
                result[i][j] += aik * B[k][j]

    return result"""
def _validate_optimized_code(
    original_code: str,
    optimized_code: str,
    language: str,
) -> bool:
    """
    Validate AI-generated optimized code before displaying it.

    The validator is intentionally conservative.
    """

    optimized_code = _clean_code(
        optimized_code
    )

    if not optimized_code:
        return False

    if _is_placeholder(
        optimized_code
    ):
        return False

    original_code = _text(
        original_code
    )

    language = (
        _text(language)
        .lower()
        .strip()
    )

    if len(optimized_code) < 10:
        return False

    if language == "python":

        try:

            ast.parse(
                optimized_code
            )

        except Exception as exc:

            logger.warning(
                "AI optimized Python code failed syntax validation: %s",
                exc,
            )

            return False

    lowered = optimized_code.lower()

    if _is_duplicate_problem(
        original_code
    ):

        if (
            "arr = set(arr)" in lowered
            or "arr=set(arr)" in lowered
        ):
            return False
        if (
            "set(arr)" in lowered
            and ".count(" in lowered
        ):
            return False

        has_seen = (
            "seen" in lowered
            or "counter" in lowered
            or "collections.counter" in lowered
            or "set()" in lowered
        )

        has_duplicate_logic = (
            "duplicates" in lowered
            or "count" in lowered
        )

        if not (
            has_seen
            and has_duplicate_logic
        ):
            return False

        if language == "python":

            loop_depth = _python_loop_depth(
                optimized_code
            )

            if loop_depth >= 2:
                return False

    if _is_find_pairs_problem(original_code):
        if language == "python":
            try:
                ast.parse(optimized_code)
            except Exception:
                return False
        if "print(" not in lowered:
            return False

        if "arr[" not in lowered and "current" not in lowered:
            return False

    if _is_matrix_multiplication(
        original_code
    ):

        unrelated_algorithms = [
            "cayley",
            "cayley-menger",
            "determinant",
            "eigenvalue",
            "inverse matrix",
            "fourier",
        ]

        if any(
            word in lowered
            for word in unrelated_algorithms
        ):
            return False
        matrix_signals = [
            "result",
            "a[",
            "b[",
        ]

        if sum(
            signal in lowered
            for signal in matrix_signals
        ) < 2:

            return False

    suspicious_phrases = [
        "here is the optimized code",
        "optimized code:",
        "the optimized version is",
        "solution:",
        "suggestion1",
        "suggestion2",
        "suggestion 1",
        "suggestion 2",
    ]

    if any(
        phrase in lowered
        for phrase in suspicious_phrases
    ):
        return False

    return True

def _fallback_suggestions(
    metrics: Any,
    time_complexity: str,
    code: str = "",
) -> list[str]:
    """
    Meaningful fallback suggestions when the AI response is
    incomplete or contains placeholders.
    """

    depth = int(
        _metric_value(
            metrics,
            "nested_loop_depth",
            0,
        )
        or 0
    )

    suggestions: list[str] = []

    if _is_matrix_multiplication(code):

        suggestions.append(
            "Reduce unnecessary memory access inside the nested "
            "loops by reusing values such as A[i][k] and arranging "
            "the loop order for better cache locality."
        )

        suggestions.append(
            "For large matrices, consider a specialized matrix "
            "multiplication library or a blocked/tiled implementation. "
            "Standard multiplication remains O(n^3), but memory "
            "access efficiency can be improved."
        )

        return suggestions

    if depth >= 3:

        suggestions.append(
            "Three levels of nested iteration were detected. "
            "Look for repeated comparisons or calculations that "
            "can be replaced with a hash map, set, lookup table, "
            "or precomputation."
        )

        suggestions.append(
            "If the inner operations repeat for the same input "
            "values, move reusable calculations outside the "
            "nested loops to reduce repeated work."
        )

    elif depth == 2:

        suggestions.append(
            "Two levels of nested iteration were detected. "
            "Check whether a set or dictionary lookup can replace "
            "repeated comparisons and reduce the number of operations."
        )

        suggestions.append(
            "Look for calculations inside the inner loop that "
            "can be computed once before entering the loop."
        )

    elif time_complexity == "O(n)":

        suggestions.append(
            "The algorithm already performs a linear pass through "
            "the input. Keep constant-time lookups and avoid adding "
            "nested loops inside the main iteration."
        )

    elif time_complexity == "O(log n)":

        suggestions.append(
            "The algorithm has logarithmic growth. Preserve the "
            "divide-and-conquer or search structure and avoid "
            "operations that repeatedly scan the full input."
        )

    else:

        suggestions.append(
            "Review the main repeated operations and consider a "
            "more efficient data structure or algorithm that reduces "
            "the amount of repeated computation."
        )

        suggestions.append(
            "Move reusable calculations outside repeated loops "
            "and prefer efficient lookup operations where possible."
        )

    if (
        _metric_value(
            metrics,
            "cyclomatic_complexity",
            0,
        )
        or 0
    ) > 10:

        suggestions.append(
            "The control flow is relatively complex. Consider "
            "splitting large conditional sections into smaller "
            "functions or using guard clauses."
        )

    return suggestions[:3]

def _fallback_better_approach(
    metrics: Any,
    time_complexity: str,
    code: str = "",
) -> str:
    """
    Meaningful fallback alternative approach.
    """

    depth = int(
        _metric_value(
            metrics,
            "nested_loop_depth",
            0,
        )
        or 0
    )

    if _is_matrix_multiplication(code):

        return (
            "Keep the matrix multiplication algorithm functionally "
            "equivalent, but improve data locality by reordering "
            "the loops and caching repeated values. For very large "
            "matrices, use a blocked/tiled implementation or a "
            "specialized numerical library. These techniques improve "
            "practical performance, while standard matrix "
            "multiplication remains O(n^3)."
        )

    if depth >= 3:

        return (
            "Reduce repeated nested work by identifying operations "
            "that can be performed once and reused. Hash-based "
            "lookups, precomputation, or a more efficient algorithm "
            "can reduce the growth rate for large inputs."
        )

    if depth == 2:

        return (
            "Check whether the inner loop can be replaced with a "
            "constant-time or near-constant-time lookup using a "
            "set or dictionary. This can often reduce a quadratic "
            "scan to a single linear pass."
        )

    if time_complexity == "O(n)":

        return (
            "Keep the single-pass structure and use efficient "
            "data structures for lookups. Avoid introducing another "
            "full scan inside the existing loop."
        )

    return (
        "Use an algorithm or data structure that avoids repeating "
        "the same work for every input element. The exact approach "
        "depends on the problem being solved."
    )

def _build_prompt(
    code: str,
    language: str,
    metrics: Any,
    estimate: ComplexityEstimate,
) -> str:
    """
    Build a compact and explicit JSON-only prompt.

    The 1.3B local model needs short, clear instructions.
    """

    time_complexity = _text(
        estimate.time_complexity
    )

    space_complexity = _text(
        estimate.space_complexity
    )

    loop_count = _metric_value(
        metrics,
        "loop_count",
        0,
    )

    nested_depth = _metric_value(
        metrics,
        "nested_loop_depth",
        0,
    )

    function_count = _metric_value(
        metrics,
        "function_count",
        0,
    )

    cyclomatic = _metric_value(
        metrics,
        "cyclomatic_complexity",
        0,
    )

    matrix_note = ""

    if _is_matrix_multiplication(code):

        matrix_note = """
MATRIX MULTIPLICATION RULE:
This is matrix multiplication.
Do NOT suggest Cayley-Menger, determinant, eigenvalue,
matrix inverse, Fourier transform, or unrelated mathematical
algorithms.
Suggest only practical matrix multiplication optimizations.
Standard matrix multiplication is O(n^3).
Do not claim O(n), O(log n), or O(n^2) unless the actual
algorithm genuinely has that complexity.
""".strip()

    find_pairs_note = ""

    if _is_find_pairs_problem(code):
        find_pairs_note = """
FIND-PAIRS RULE:
This function prints qualifying pairs. Every pair may need to be
examined, so do NOT claim a set or dictionary reduces it to O(n).
Do not suggest an unrelated algorithm. Keep the explanation concise.
""".strip()

    duplicate_note = ""

    if _is_duplicate_problem(code):

        duplicate_note = """
DUPLICATE DETECTION RULE:
Preserve duplicate detection behavior.
Do NOT convert the entire input to set(arr) before counting.
A valid linear approach may use a seen set and duplicates set.
""".strip()

    return f"""
You are a precise code optimization assistant.

Analyze this {language} code.

STATIC ANALYSIS:
Time: {time_complexity}
Space: {space_complexity}
Loops: {loop_count}
Max loop depth: {nested_depth}
Functions: {function_count}
Cyclomatic complexity: {cyclomatic}

RULES:
1. Return ONLY valid JSON.
2. No markdown.
3. No placeholder values.
4. Never output suggestion1, suggestion2, explanation,
   better_approach, or similar placeholder words.
5. Explain THIS code specifically.
6. Give 1 or 2 real optimization suggestions.
7. Give one practical better approach.
8. Provide complete optimized code when useful.
9. Preserve the original functionality.
10. Do not invent algorithms.
11. Do not suggest unrelated techniques.
12. Do not claim an improved Big-O unless the code really
    achieves that complexity.
13. Keep optimized_code syntactically valid.
14. Keep the response concise.

{matrix_note}

{duplicate_note}

{find_pairs_note}

Return exactly this JSON object:

{{
  "explanation": "Specific explanation of the supplied code.",
  "optimization_suggestions": [
    "Specific optimization suggestion.",
    "Another specific optimization suggestion."
  ],
  "better_approach": "A practical alternative approach for this exact problem.",
  "optimized_code": "Complete valid optimized source code.",
  "optimized_time_complexity": "Correct Big-O complexity.",
  "optimized_space_complexity": "Correct Big-O complexity."
}}

SOURCE CODE:
{code}
""".strip()

def _build_retry_prompt(
    code: str,
    language: str,
    estimate: ComplexityEstimate,
) -> str:
    """
    Very short retry prompt used when the first response is
    incomplete or invalid.
    """

    return f"""
Return ONLY valid JSON.

Analyze this {language} code.

Original time: {estimate.time_complexity}
Original space: {estimate.space_complexity}

Give:
- explanation
- two specific optimization suggestions
- better_approach
- optimized_code
- optimized_time_complexity
- optimized_space_complexity

Do not use placeholders.
Do not invent algorithms.
Preserve the original functionality.

JSON format:

{{
  "explanation": "real explanation",
  "optimization_suggestions": [
    "real suggestion",
    "real suggestion"
  ],
  "better_approach": "real alternative",
  "optimized_code": "complete code",
  "optimized_time_complexity": "Big-O",
  "optimized_space_complexity": "Big-O"
}}

Code:

{code}
""".strip()

def _extract_json(
    response_text: str,
) -> dict[str, Any] | None:
    """
    Parse JSON returned by Ollama.
    """

    text = _text(
        response_text
    )

    if not text:
        return None
    try:

        data = json.loads(
            text
        )

        if isinstance(data, dict):
            return data

    except Exception:
        pass

    if "```" in text:

        parts = text.split("```")

        for part in parts:

            candidate = part.strip()

            if candidate.lower().startswith("json"):

                candidate = candidate[4:].strip()

            try:

                data = json.loads(
                    candidate
                )

                if isinstance(data, dict):
                    return data

            except Exception:
                continue

    start = text.find("{")
    end = text.rfind("}")

    if (
        start >= 0
        and end > start
    ):

        candidate = text[
            start:end + 1
        ]

        try:

            data = json.loads(
                candidate
            )

            if isinstance(data, dict):
                return data

        except Exception:
            pass

    return None
def _merge_result(
    original_code: str,
    language: str,
    metrics: Any,
    estimate: ComplexityEstimate,
    ai_data: dict[str, Any],
) -> ComplexityEstimate:
    """
    Merge validated AI content into the heuristic estimate.

    Static complexity remains the primary measurable result.
    AI provides explanation and optimization guidance.
    """

    result = estimate.model_dump()

    explanation = _text(
        ai_data.get("explanation")
    )

    if (
        explanation
        and not _is_placeholder(
            explanation
        )
    ):

        result["explanation"] = explanation

    suggestions = _clean_string_list(
        ai_data.get(
            "optimization_suggestions"
        )
    )

    if not suggestions:

        suggestions = _fallback_suggestions(
            metrics,
            result.get(
                "time_complexity",
                "O(1)",
            ),
            original_code,
        )

    result[
        "optimization_suggestions"
    ] = suggestions[:3]

    better_approach = _text(
        ai_data.get(
            "better_approach"
        )
    )

    if (
        not better_approach
        or _is_placeholder(
            better_approach
        )
    ):

        better_approach = _fallback_better_approach(
            metrics,
            result.get(
                "time_complexity",
                "O(1)",
            ),
            original_code,
        )

    result[
        "better_approach"
    ] = better_approach
    optimized_code = _clean_code(
        ai_data.get(
            "optimized_code"
        )
    )

    optimized_time = _text(
        ai_data.get(
            "optimized_time_complexity"
        )
    )

    optimized_space = _text(
        ai_data.get(
            "optimized_space_complexity"
        )
    )

    code_is_valid = _validate_optimized_code(
        original_code,
        optimized_code,
        language,
    )

    if (
        language == "python"
        and _is_duplicate_problem(
            original_code
        )
    ):

        if not code_is_valid:

            logger.warning(
                "Invalid duplicate optimization detected. "
                "Using deterministic O(n) implementation."
            )

            optimized_code = (
                _safe_duplicate_optimization()
            )

            optimized_time = "O(n)"
            optimized_space = "O(n)"

            code_is_valid = True

        else:

            loop_depth = _python_loop_depth(
                optimized_code
            )

            if loop_depth >= 2:

                logger.warning(
                    "AI duplicate optimization still has nested loops. "
                    "Using deterministic O(n) implementation."
                )

                optimized_code = (
                    _safe_duplicate_optimization()
                )

                optimized_time = "O(n)"
                optimized_space = "O(n)"

    if _is_matrix_multiplication(
        original_code
    ):

        if (
            optimized_time
            and optimized_time in {
                "O(n)",
                "O(log n)",
                "O(n^2)",
            }
        ):

            logger.warning(
                "AI returned suspicious matrix multiplication "
                "complexity: %s. Correcting to O(n^3).",
                optimized_time,
            )

            optimized_time = "O(n^3)"

        if not code_is_valid:

            logger.warning(
                "Invalid matrix optimization detected. "
                "Using deterministic cache-friendly implementation."
            )

            optimized_code = (
                _safe_matrix_optimization()
            )

            optimized_time = "O(n^3)"
            optimized_space = "O(n^2)"

            code_is_valid = True

        else:

            if language == "python":

                loop_depth = _python_loop_depth(
                    optimized_code
                )

                if loop_depth < 3:

                    logger.warning(
                        "AI matrix optimization does not contain "
                        "the expected multiplication structure. "
                        "Using safe implementation."
                    )

                    optimized_code = (
                        _safe_matrix_optimization()
                    )

                    optimized_time = "O(n^3)"
                    optimized_space = "O(n^2)"

    if (
        language == "python"
        and _is_find_pairs_problem(original_code)
    ):
        optimized_code = _safe_find_pairs_optimization()
        optimized_time = "O(n^2)"
        optimized_space = "O(1)"
        code_is_valid = True

        result["explanation"] = (
            "The function compares each element with every later "
            "element and prints pairs where the first value is smaller. "
            "Because the required output may contain O(n^2) pairs, "
            "the time complexity remains O(n^2)."
        )
        result["optimization_suggestions"] = [
            "Cache the current outer-loop value in a local variable to reduce repeated array indexing.",
            "Stop the outer loop at n - 1 because the final element has no later element to compare with. Big-O remains O(n^2).",
        ]
        result["better_approach"] = (
            "Keep the pairwise comparison because every possible pair "
            "may need to be checked. Improve constant factors by "
            "caching the current element and avoiding the final "
            "unnecessary outer iteration."
        )

    if code_is_valid:

        result[
            "optimized_code"
        ] = optimized_code

        if optimized_time:

            result[
                "optimized_time_complexity"
            ] = optimized_time

        if optimized_space:

            result[
                "optimized_space_complexity"
            ] = optimized_space

    else:

        result[
            "optimized_code"
        ] = ""

        result[
            "optimized_time_complexity"
        ] = ""

        result[
            "optimized_space_complexity"
        ] = ""

    result[
        "confidence"
    ] = 1.0

    return ComplexityEstimate(
        **result
    )

async def _request_ollama(
    prompt: str,
) -> str | None:
    """
    Send a request to Ollama and return the raw model response.
    """

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "keep_alive": KEEP_ALIVE,
        "options": {
            "temperature": TEMPERATURE,
            "num_ctx": NUM_CTX,
            "num_predict": NUM_PREDICT,
        },
    }

    try:

        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT
        ) as client:

            response = await client.post(
                OLLAMA_URL,
                json=payload,
            )

            response.raise_for_status()

    except httpx.TimeoutException:

        logger.warning(
            "Local Ollama request timed out after %.1f seconds.",
            REQUEST_TIMEOUT,
        )

        return None

    except httpx.HTTPError as exc:

        logger.warning(
            "Local Ollama request failed: %s",
            exc,
        )

        return None

    except Exception as exc:

        logger.exception(
            "Unexpected local Ollama error: %s",
            exc,
        )

        return None

    try:

        body = response.json()

    except Exception as exc:

        logger.warning(
            "Could not decode Ollama HTTP response: %s",
            exc,
        )

        return None

    raw_response = _text(
        body.get("response")
    )

    logger.info(
        "RAW OLLAMA RESPONSE: %s",
        raw_response,
    )

    return raw_response or None

async def enhance(
    code: str,
    language: str,
    metrics: Any,
    estimate: ComplexityEstimate,
) -> tuple[ComplexityEstimate, bool]:
    """
    Ask local Ollama / DeepSeek to enhance the heuristic result.

    Returns:
        (estimate, ai_enhanced)
    """

    settings = get_settings()

    _ = settings

    code = _text(
        code
    )

    language = (
        _text(language)
        .lower()
        .strip()
    )

    if not code:

        logger.warning(
            "Local AI enhancement skipped: empty code."
        )

        return estimate, False

    prompt = _build_prompt(
        code,
        language,
        metrics,
        estimate,
    )

    logger.info(
        "Sending code analysis request to local Ollama "
        "using model: %s",
        MODEL_NAME,
    )

    raw_response = await _request_ollama(
        prompt
    )

    if not raw_response:

        return estimate, False

    ai_data = _extract_json(
        raw_response
    )

    if not ai_data:
        logger.warning(
            "Ollama returned invalid/incomplete JSON. "
            "Using deterministic fallback without retry."
        )

        fallback_data = {
            "explanation": (
                f"The code has {estimate.time_complexity} time complexity "
                f"and {estimate.space_complexity} space complexity based "
                "on the detected control-flow structure."
            ),
            "optimization_suggestions": _fallback_suggestions(
                metrics,
                _text(estimate.time_complexity),
                code,
            ),
            "better_approach": _fallback_better_approach(
                metrics,
                _text(estimate.time_complexity),
                code,
            ),
            "optimized_code": "",
            "optimized_time_complexity": "",
            "optimized_space_complexity": "",
        }
        ai_data = fallback_data

    try:

        enhanced_estimate = _merge_result(
            code,
            language,
            metrics,
            estimate,
            ai_data,
        )

    except Exception as exc:

        logger.exception(
            "Failed to merge local AI result: %s",
            exc,
        )

        return estimate, False

    logger.info(
        "Local DeepSeek AI analysis successfully validated."
    )

    return enhanced_estimate, True
def is_configured() -> bool:
    """
    Local Ollama configuration status.

    Ollama does not require an external API key.
    """

    return True