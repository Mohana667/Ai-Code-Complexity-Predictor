"""
Core static-analysis engine.

Strategy:
- Python: parsed with the real ast module for accurate structural metrics.
- Java / C / C++ / JavaScript: brace-depth-aware tokenization + regex
  heuristics.
- HTML / CSS: structural analysis rather than algorithmic complexity.

The output of analyze() is a StructuralMetrics object, which the
complexity_estimator then turns into a Big-O estimate.
"""

from __future__ import annotations

import ast
import re

from app.models.schemas import Language, StructuralMetrics

LOOP_KEYWORDS = {
    "python": [
        r"\bfor\b",
        r"\bwhile\b",
    ],
    "java": [
        r"\bfor\b",
        r"\bwhile\b",
        r"\bdo\b",
    ],
    "c": [
        r"\bfor\b",
        r"\bwhile\b",
        r"\bdo\b",
    ],
    "cpp": [
        r"\bfor\b",
        r"\bwhile\b",
        r"\bdo\b",
    ],
    "javascript": [
        r"\bfor\b",
        r"\bwhile\b",
        r"\bdo\b",
        r"\.forEach\(",
        r"\.map\(",
        r"\.reduce\(",
    ],
    "php": [
        r"\bfor\b",
        r"\bforeach\b",
        r"\bwhile\b",
        r"\bdo\b",
    ],
    "typescript": [
        r"\bfor\b",
        r"\bwhile\b",
        r"\bdo\b",
        r"\.forEach\(",
        r"\.map\(",
        r"\.reduce\(",
    ],
}


FUNCTION_PATTERNS = {
    "java": re.compile(
        r"(?:public|private|protected|static|final|synchronized|\s)+"
        r"[\w<>\[\],\s]+\s+(\w+)\s*\([^;{]*\)\s*\{"
    ),
    "c": re.compile(
        r"^[\w\*\s]+?\b(\w+)\s*\([^;{]*\)\s*\{",
        re.MULTILINE,
    ),
    "cpp": re.compile(
        r"^[\w\*&:<>~\s]+?\b(\w+)\s*\([^;{]*\)\s*(?:const)?\s*\{",
        re.MULTILINE,
    ),
    "javascript": re.compile(
        r"(?:function\s+(\w+)\s*\(|"
        r"const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|"
        r"(\w+)\s*\([^)]*\)\s*\{)"
    ),
    "typescript": re.compile(
        r"(?:function\s+(\w+)\s*(?:<[^>]+>)?\s*\(|"
        r"(?:const|let)\s+(\w+)\s*(?::\s*[^=]+)?=\s*(?:async\s*)?\([^)]*\)\s*=>|"
        r"(\w+)\s*\([^)]*\)\s*:\s*[^{]+\{)"
    ),
    "php": re.compile(
        r"function\s+(?:&\s*)?(\w+)\s*\([^)]*\)\s*\{"
    ),
}


CONDITIONAL_PATTERNS = [
    r"\bif\b",
    r"\belse\b",
    r"\bcase\b",
    r"\bswitch\b",
    r"\?\s*.*:\b",
]


IMPORT_PATTERNS = {
    "java": re.compile(
        r"^\s*import\s+[\w.]+;",
        re.MULTILINE,
    ),
    "c": re.compile(
        r"^\s*#include\s*[<\"][\w./]+[>\"]",
        re.MULTILINE,
    ),
    "cpp": re.compile(
        r"^\s*#include\s*[<\"][\w./]+[>\"]",
        re.MULTILINE,
    ),
    "javascript": re.compile(
        r"^\s*(?:import\s.+from\s+['\"].+['\"]|"
        r"require\(['\"].+['\"]\))",
        re.MULTILINE,
    ),
    "typescript": re.compile(
        r"^\s*(?:import\s.+from\s+['\"].+['\"]|"
        r"export\s+import\s+.+from\s+['\"].+['\"]|"
        r"require\(['\"].+['\"]\))",
        re.MULTILINE,
    ),
    "php": re.compile(
        r"^\s*(?:require|require_once|include|include_once)\s*(?:\([^;]+\)|[^;]+);",
        re.MULTILINE,
    ),
}

def _strip_comments_and_strings(
    code: str,
    language: str,
) -> str:
    """Remove comments and strings before regex-based analysis."""

    if language == "python":

        code = re.sub(
            r"#.*",
            "",
            code,
        )

    else:

        if language == "php":
            code = re.sub(
                r"#.*",
                "",
                code,
            )

        code = re.sub(
            r"//.*",
            "",
            code,
        )

        code = re.sub(
            r"/\*.*?\*/",
            "",
            code,
            flags=re.DOTALL,
        )

    code = re.sub(
        r'"(?:\\.|[^"\\])*"',
        '""',
        code,
    )

    code = re.sub(
        r"'(?:\\.|[^'\\])*'",
        "''",
        code,
    )

    return code

def _max_brace_nesting_and_loop_depth(
    code: str,
    loop_keywords: list[str],
) -> tuple[int, int]:
    """Calculate brace nesting and maximum loop nesting."""

    depth = 0
    max_depth = 0

    loop_depth_stack = []
    max_loop_depth = 0

    combined_loop_re = (
        re.compile("|".join(loop_keywords))
        if loop_keywords
        else None
    )

    lines = code.split("\n")

    for line in lines:

        if (
            combined_loop_re
            and combined_loop_re.search(line)
            and "{" in line
        ):

            loop_depth_stack.append(depth)

            max_loop_depth = max(
                max_loop_depth,
                len(loop_depth_stack),
            )

        for ch in line:

            if ch == "{":

                depth += 1

                max_depth = max(
                    max_depth,
                    depth,
                )

            elif ch == "}":

                depth = max(
                    0,
                    depth - 1,
                )

                if (
                    loop_depth_stack
                    and depth <= loop_depth_stack[-1]
                ):

                    loop_depth_stack.pop()

    return max_depth, max_loop_depth


def _python_memory_metrics(
    tree: ast.AST,
) -> tuple[int, bool, int]:
    """
    Detect Python memory allocation.

    Returns:
        memory_allocation_count
        dynamic_memory_detected
        memory_nesting_depth
    """

    memory_allocation_count = 0
    dynamic_memory_detected = False
    memory_nesting_depth = 0

    container_names: set[str] = set()

    for node in ast.walk(tree):

        if isinstance(
            node,
            ast.Assign,
        ):

            if isinstance(
                node.value,
                (
                    ast.List,
                    ast.Dict,
                    ast.Set,
                ),
            ):

                memory_allocation_count += 1

                for target in node.targets:

                    if isinstance(
                        target,
                        ast.Name,
                    ):

                        container_names.add(
                            target.id
                        )

        elif isinstance(
            node,
            ast.AnnAssign,
        ):

            if isinstance(
                node.value,
                (
                    ast.List,
                    ast.Dict,
                    ast.Set,
                ),
            ):

                memory_allocation_count += 1

                if isinstance(
                    node.target,
                    ast.Name,
                ):

                    container_names.add(
                        node.target.id
                    )

    for node in ast.walk(tree):

        if isinstance(
            node,
            (
                ast.ListComp,
                ast.DictComp,
                ast.SetComp,
            ),
        ):

            memory_allocation_count += 1

            dynamic_memory_detected = True

            depth = len(
                node.generators
            )

            memory_nesting_depth = max(
                memory_nesting_depth,
                depth,
            )

        elif isinstance(
            node,
            ast.Call,
        ):

            called_name = getattr(
                node.func,
                "id",
                None,
            )

            if called_name in {
                "list",
                "dict",
                "set",
            }:

                memory_allocation_count += 1

                dynamic_memory_detected = True

    def scan(
        node: ast.AST,
        loop_depth: int,
    ) -> None:

        nonlocal memory_allocation_count, dynamic_memory_detected, memory_nesting_depth

        current_loop_depth = loop_depth

        if isinstance(
            node,
            (
                ast.For,
                ast.While,
                ast.AsyncFor,
            ),
        ):

            current_loop_depth += 1

        if isinstance(
            node,
            ast.Call,
        ):

            if isinstance(
                node.func,
                ast.Attribute,
            ):

                method_name = node.func.attr

                if method_name in {
                    "append",
                    "extend",
                    "insert",
                }:

                    receiver = node.func.value

                    if (
                        isinstance(
                            receiver,
                            ast.Name,
                        )
                        and receiver.id in container_names
                    ):

                        memory_allocation_count += 1

                        if current_loop_depth > 0:

                            dynamic_memory_detected = True

                            memory_nesting_depth = max(
                                memory_nesting_depth,
                                current_loop_depth,
                            )

        for child in ast.iter_child_nodes(
            node
        ):

            scan(
                child,
                current_loop_depth,
            )

    scan(
        tree,
        0,
    )

    return (
        memory_allocation_count,
        dynamic_memory_detected,
        memory_nesting_depth,
    )

def _analyze_python(
    code: str,
) -> StructuralMetrics:

    try:

        tree = ast.parse(
            code
        )

    except SyntaxError as e:

        raise ValueError(
            f"Python syntax error: {e}"
        ) from e

    loop_count = 0
    max_nesting = 0
    max_loop_nesting = 0

    function_count = 0

    recursive_functions: list[str] = []
    recursive_call_count = 0

    logarithmic_loop_detected = False

    conditional_count = 0

    cyclomatic = 1

    def walk(
        node,
        depth: int,
        loop_depth: int,
        current_fn: str | None,
    ):

        nonlocal loop_count, max_nesting, max_loop_nesting, function_count, conditional_count, cyclomatic, recursive_call_count

        max_nesting = max(
            max_nesting,
            depth,
        )

        if isinstance(
            node,
            (
                ast.For,
                ast.While,
                ast.AsyncFor,
            ),
        ):

            loop_count += 1

            loop_depth += 1

            max_loop_nesting = max(
                max_loop_nesting,
                loop_depth,
            )

            cyclomatic += 1

        elif isinstance(
            node,
            (
                ast.If,
                ast.IfExp,
            ),
        ):

            conditional_count += 1

            cyclomatic += 1

        elif isinstance(
            node,
            ast.BoolOp,
        ):

            cyclomatic += max(
                0,
                len(node.values) - 1,
            )

        elif isinstance(
            node,
            (
                ast.FunctionDef,
                ast.AsyncFunctionDef,
            ),
        ):

            function_count += 1

            current_fn = node.name

        elif (
            isinstance(
                node,
                ast.Call,
            )
            and current_fn
        ):

            called_name = (
                getattr(
                    node.func,
                    "id",
                    None,
                )
                or getattr(
                    node.func,
                    "attr",
                    None,
                )
            )

            if called_name == current_fn:

                recursive_call_count += 1

                if (
                    current_fn
                    not in recursive_functions
                ):

                    recursive_functions.append(
                        current_fn
                    )

        elif isinstance(
            node,
            ast.Try,
        ):

            cyclomatic += len(
                node.handlers
            )

        child_depth = (
            depth + 1
            if isinstance(
                node,
                (
                    ast.For,
                    ast.While,
                    ast.AsyncFor,
                    ast.If,
                    ast.FunctionDef,
                    ast.AsyncFunctionDef,
                    ast.With,
                    ast.Try,
                ),
            )
            else depth
        )

        for child in ast.iter_child_nodes(
            node
        ):

            walk(
                child,
                child_depth,
                loop_depth,
                current_fn,
            )

    walk(
        tree,
        0,
        0,
        None,
    )

    for node in ast.walk(tree):

        if not isinstance(
            node,
            ast.While,
        ):
            continue

        source_segment = ast.get_source_segment(
            code,
            node,
        )

        if not source_segment:
            continue

        normalized = re.sub(
            r"\s+",
            "",
            source_segment,
        ).lower()

        has_mid = (
            "mid" in normalized
            or "middle" in normalized
        )

        has_binary_search_update = (
            ("left=" in normalized and "mid" in normalized)
            or ("right=" in normalized and "mid" in normalized)
            or ("low=" in normalized and "mid" in normalized)
            or ("high=" in normalized and "mid" in normalized)
        )

        has_geometric_update = (
            "*=2" in normalized
            or "//=2" in normalized
            or "/=2" in normalized
            or "*=2.0" in normalized
            or "/=2.0" in normalized
        )

        if (
            (has_mid and has_binary_search_update)
            or has_geometric_update
        ):

            logarithmic_loop_detected = True

            break

    imports = sum(
        1
        for n in ast.walk(tree)
        if isinstance(
            n,
            (
                ast.Import,
                ast.ImportFrom,
            ),
        )
    )

    loc = len(
        [
            line
            for line in code.splitlines()
            if line.strip()
        ]
    )

    (
        memory_allocation_count,
        dynamic_memory_detected,
        memory_nesting_depth,
    ) = _python_memory_metrics(
        tree
    )

    return StructuralMetrics(
        lines_of_code=loc,
        max_nesting_depth=max_nesting,
        loop_count=loop_count,
        nested_loop_depth=max_loop_nesting,
        function_count=function_count,
        recursive_functions=recursive_functions,
        recursive_call_count=recursive_call_count,
        conditional_count=conditional_count,
        dependency_count=imports,
        cyclomatic_complexity=cyclomatic,
        memory_allocation_count=memory_allocation_count,
        dynamic_memory_detected=dynamic_memory_detected,
        memory_nesting_depth=memory_nesting_depth,
        logarithmic_loop_detected=logarithmic_loop_detected,
    )

def _extract_body(
    clean: str,
    brace_start_idx: int,
) -> str:
    """Return function body using matching brace depth."""

    depth = 0

    for i in range(
        brace_start_idx,
        len(clean),
    ):

        if clean[i] == "{":

            depth += 1

        elif clean[i] == "}":

            depth -= 1

            if depth == 0:

                return clean[
                    brace_start_idx + 1:i
                ]

    return clean[
        brace_start_idx + 1:
    ]

def _analyze_brace_language(
    code: str,
    language: str,
) -> StructuralMetrics:

    clean = _strip_comments_and_strings(
        code,
        language,
    )

    loop_kw = LOOP_KEYWORDS.get(
        language,
        [
            r"\bfor\b",
            r"\bwhile\b",
        ],
    )

    (
        max_nesting,
        max_loop_nesting,
    ) = _max_brace_nesting_and_loop_depth(
        clean,
        loop_kw,
    )

    loop_count = sum(
        len(
            re.findall(
                kw,
                clean,
            )
        )
        for kw in loop_kw
    )

    conditional_count = sum(
        len(
            re.findall(
                pattern,
                clean,
            )
        )
        for pattern in CONDITIONAL_PATTERNS
    )

    fn_pattern = FUNCTION_PATTERNS.get(
        language
    )

    function_names: list[str] = []

    recursive_functions: list[str] = []

    recursive_call_count = 0

    control_keywords = {
        "if",
        "else",
        "for",
        "while",
        "do",
        "switch",
        "case",
        "catch",
        "try",
        "finally",
        "return",
        "new",
    }

    if fn_pattern:

        for match in fn_pattern.finditer(
            clean
        ):

            name = next(
                (
                    group
                    for group in match.groups()
                    if group
                ),
                None,
            )

            if not name:
                continue

            if name in control_keywords:
                continue

            if name not in function_names:

                function_names.append(
                    name
                )
            brace_idx = clean.find(
                "{",
                match.end() - 1,
            )

            if brace_idx == -1:
                continue

            body = _extract_body(
                clean,
                brace_idx,
            )

            recursive_matches = re.findall(
                rf"\b{re.escape(name)}\s*\(",
                body,
            )

            if recursive_matches:

                recursive_call_count += len(
                    recursive_matches
                )

                if name not in recursive_functions:

                    recursive_functions.append(
                        name
                    )

    function_count = len(
        function_names
    )
    import_pattern = IMPORT_PATTERNS.get(
        language
    )

    dependency_count = (
        len(
            import_pattern.findall(
                clean
            )
        )
        if import_pattern
        else 0
    )

    # Lines of code

    loc = len(
        [
            line
            for line in code.splitlines()
            if line.strip()
        ]
    )

    # Memory Allocation

    memory_allocation_patterns = {
        "c": [
            r"\bmalloc\s*\(",
            r"\bcalloc\s*\(",
            r"\brealloc\s*\(",
        ],
        "cpp": [
            r"\bmalloc\s*\(",
            r"\bcalloc\s*\(",
            r"\brealloc\s*\(",
            r"\bnew\s+",
        ],
        "java": [
            r"\bnew\s+\w+",
            r"\bnew\s+\w+\s*\[",
        ],
        "php": [
            r"\bnew\s+[A-Za-z_]\w*",
        ],
        "typescript": [],
    }

    memory_patterns = memory_allocation_patterns.get(
        language,
        []
    )

    memory_allocation_count = sum(
        len(re.findall(pattern, clean))
        for pattern in memory_patterns
    )

    dynamic_memory_detected = (
        memory_allocation_count > 0
    )

    memory_nesting_depth = 0

    cyclomatic = (
        1
        + conditional_count
        + loop_count
    )

    new_array_pattern = re.compile(
        r"\bnew\s+[A-Za-z_][\w.<>]*\s*((?:\[[^\]]*\])+)"
    )

    for match in new_array_pattern.finditer(
        clean
    ):

        dimensions = re.findall(
            r"\[([^\]]*)\]",
            match.group(1),
        )

        memory_allocation_count += 1

        # Check whether allocation depends on variable

        variable_dimension = any(
            dim.strip()
            and not dim.strip().isdigit()
            for dim in dimensions
        )

        if variable_dimension:

            dynamic_memory_detected = True

            memory_nesting_depth = max(
                memory_nesting_depth,
                len(dimensions),
            )

    # Final metrics

    return StructuralMetrics(
        lines_of_code=loc,
        max_nesting_depth=max_nesting,
        loop_count=loop_count,
        nested_loop_depth=max_loop_nesting,
        function_count=function_count,
        recursive_functions=recursive_functions,
        recursive_call_count=recursive_call_count,
        conditional_count=conditional_count,
        dependency_count=dependency_count,
        cyclomatic_complexity=cyclomatic,
        memory_allocation_count=memory_allocation_count,
        dynamic_memory_detected=dynamic_memory_detected,
        memory_nesting_depth=memory_nesting_depth,
        logarithmic_loop_detected=False,
    )

# HTML / CSS

def _analyze_markup(
    code: str,
    language: str,
) -> StructuralMetrics:
    """
    HTML/CSS aren't algorithmic languages.

    We report structural metrics instead.
    """
    # HTML

    if language == "html":

        tags = re.findall(
            r"<\s*([A-Za-z][\w:-]*)",
            code,
        )

        unique_tags = len(
            set(
                tag.lower()
                for tag in tags
            )
        )

        loc = len(
            [
                line
                for line in code.splitlines()
                if line.strip()
            ]
        )

        return StructuralMetrics(
            lines_of_code=loc,
            max_nesting_depth=0,
            loop_count=0,
            nested_loop_depth=0,
            function_count=0,
            recursive_functions=[],
            recursive_call_count=0,
            conditional_count=0,
            dependency_count=0,
            cyclomatic_complexity=unique_tags,
            memory_allocation_count=memory_allocation_count,
            dynamic_memory_detected=dynamic_memory_detected,
            memory_nesting_depth=memory_nesting_depth,
            logarithmic_loop_detected=False,
        )

    # CSS

    rules = re.findall(
        r"[^{}]+\{[^{}]*\}",
        code,
    )

    max_selector_complexity = max(
        (
            len(
                re.findall(
                    r"[.#]?\w[\w-]*",
                    selector.split("{")[0],
                )
            )
            for selector in rules
        ),
        default=0,
    )

    loc = len(
        [
            line
            for line in code.splitlines()
            if line.strip()
        ]
    )

    return StructuralMetrics(
        lines_of_code=loc,
        max_nesting_depth=code.count("{"),
        loop_count=0,
        nested_loop_depth=0,
        function_count=0,
        recursive_functions=[],
        recursive_call_count=0,
        conditional_count=0,
        dependency_count=len(
            re.findall(
                r"@import",
                code,
            )
        ),
        cyclomatic_complexity=max_selector_complexity,
        memory_allocation_count=0,
        dynamic_memory_detected=False,
        memory_nesting_depth=0,
        logarithmic_loop_detected=False,
    )

def analyze(
    code: str,
    language: Language,
) -> StructuralMetrics:

    lang = (
        language.value
        if isinstance(
            language,
            Language,
        )
        else language
    )

    if lang == "python":

        return _analyze_python(
            code
        )

    if lang in (
        "java",
        "c",
        "cpp",
        "javascript",
        "php",
        "typescript",
    ):

        return _analyze_brace_language(
            code,
            lang,
        )

    if lang in (
        "html",
        "css",
    ):

        return _analyze_markup(
            code,
            lang,
        )

    raise ValueError(
        f"Unsupported language: {lang}"
    )