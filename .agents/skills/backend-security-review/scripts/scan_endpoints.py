#!/usr/bin/env python3
"""
scan_endpoints.py — heuristic first-pass scanner for Next.js API route handlers.

Finds every app/api/**/route.{ts,tsx,js,jsx} and pages/api/**/*.{ts,tsx,js,jsx}
file, lists the HTTP methods each one handles, and flags textual patterns worth
a closer look (missing auth indicators, string-built SQL, req.body spread into
a DB write, dangerouslySetInnerHTML, permissive CORS, missing rate-limit call,
hardcoded-looking secrets, sensitive-data logging, etc).

This is regex-based, not a real parser — it WILL miss things wrapped in helper
functions, and it WILL occasionally flag safe code. Treat every finding as a
lead to manually verify, not a confirmed vulnerability, and still review every
unflagged endpoint against the full checklist in references/vulnerability-checklist.md.

Usage:
    python3 scan_endpoints.py <project-root>
    python3 scan_endpoints.py .
"""

import re
import sys
from pathlib import Path

EXCLUDE_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".turbo"}

ROUTE_GLOBS = [
    "app/**/route.ts", "app/**/route.tsx", "app/**/route.js", "app/**/route.jsx",
    "pages/api/**/*.ts", "pages/api/**/*.tsx", "pages/api/**/*.js", "pages/api/**/*.jsx",
]

HTTP_METHOD_RE = re.compile(r"export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b")

AUTH_INDICATORS = [
    "getServerSession", "auth()", "getToken", "requireAuth", "session.user",
    "verifyToken", "jwt.verify", "Authorization", "authOptions", "middleware",
    "withAuth", "currentUser", "getSession",
]

RATE_LIMIT_INDICATORS = ["ratelimit", "rateLimit", "rate-limit", "limiter", "Ratelimit"]

# (id, description, category, regex, severity_hint)
PATTERNS = [
    (
        "raw-sql-interpolation",
        "Template-literal SQL passed to a query/execute call — check for string-built SQL instead of parameterized queries.",
        "SQL injection",
        re.compile(r"(?:queryRawUnsafe|\.query|\.execute)\s*\(\s*`[^`]*\$\{"),
        "Critical",
    ),
    (
        "body-as-mongo-filter",
        "req.body/body passed directly as a query filter — check for NoSQL operator injection.",
        "NoSQL injection",
        re.compile(r"\.(find|findOne|findOneAndUpdate|deleteOne|updateOne|updateMany)\s*\(\s*(req\.body|body)\s*\)"),
        "Critical",
    ),
    (
        "body-spread-into-write",
        "req.body/body spread or passed wholesale into a create/update call — check for mass assignment.",
        "Mass assignment",
        re.compile(r"(create|update|updateOne|updateMany|insertOne|findOneAndUpdate)\s*\(\s*\{[^)]{0,200}?\b(req\.body|body)\b"),
        "High",
    ),
    (
        "spread-body",
        "...body/...req.body spread into an object — check what fields this lets a caller set.",
        "Mass assignment / prototype pollution",
        re.compile(r"\.\.\.(req\.body|body)\b"),
        "Medium",
    ),
    (
        "dangerously-set-inner-html",
        "dangerouslySetInnerHTML found — check the source is sanitized before this point.",
        "XSS",
        re.compile(r"dangerouslySetInnerHTML"),
        "High",
    ),
    (
        "eval-or-new-function",
        "eval() or new Function() found — dynamic code execution from any reachable input is dangerous.",
        "Code injection",
        re.compile(r"\beval\s*\(|new\s+Function\s*\("),
        "Critical",
    ),
    (
        "permissive-cors-wildcard",
        "Access-Control-Allow-Origin set to '*' — check if credentials are also allowed, and whether this is intentional.",
        "CORS misconfiguration",
        re.compile(r"Access-Control-Allow-Origin[^\n]{0,40}['\"]\*['\"]"),
        "Medium",
    ),
    (
        "cors-reflects-origin",
        "Access-Control-Allow-Origin appears to reflect the request's Origin header directly — defeats CORS.",
        "CORS misconfiguration",
        re.compile(r"Access-Control-Allow-Origin[^\n]{0,120}(headers\.get\(['\"]origin['\"]\)|req\.headers\.origin)", re.IGNORECASE),
        "Medium",
    ),
    (
        "error-stack-in-response",
        "e.stack / error.stack appears near a response call — check it isn't returned to the client.",
        "Information disclosure",
        re.compile(r"(Response\.json|res\.json|res\.status\([^)]*\)\.json)\([^)]{0,150}\.stack"),
        "Medium",
    ),
    (
        "sensitive-data-logging",
        "console.log/error/warn includes a password/token/secret-named variable — check what's actually logged.",
        "Sensitive data logging",
        re.compile(r"console\.(log|error|warn)\([^)]{0,200}\b(password|token|secret|apiKey)\b", re.IGNORECASE),
        "Medium",
    ),
    (
        "next-public-secret",
        "NEXT_PUBLIC_ env var with a secret-looking name — this gets bundled into client-side JS.",
        "Secret exposure",
        re.compile(r"NEXT_PUBLIC_[A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD)", re.IGNORECASE),
        "Critical",
    ),
    (
        "hardcoded-secret-looking-literal",
        "String literal assigned to a password/secret/apiKey/token-named variable — check it isn't a real hardcoded credential.",
        "Secret exposure",
        re.compile(r"\b[A-Za-z0-9_]*(PASSWORD|SECRET|API_?KEY|TOKEN)[A-Za-z0-9_]*\s*[:=]\s*['\"][^'\"\n]{6,}['\"]", re.IGNORECASE),
        "Critical",
    ),
]


def find_route_files(root: Path):
    seen = set()
    for pattern in ROUTE_GLOBS:
        for path in root.glob(pattern):
            if any(part in EXCLUDE_DIRS for part in path.parts):
                continue
            if path.is_file() and path not in seen:
                seen.add(path)
                yield path


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def scan_file(path: Path, root: Path):
    text = path.read_text(errors="ignore")
    rel = path.relative_to(root)
    is_app_router = "app" in path.parts and path.name.startswith("route.")

    methods = sorted(set(HTTP_METHOD_RE.findall(text))) if is_app_router else []

    findings = []
    for fid, desc, category, regex, severity in PATTERNS:
        for m in regex.finditer(text):
            # Skip hardcoded-secret matches that are clearly reading from env vars
            if fid == "hardcoded-secret-looking-literal" and "process.env" in text[max(0, m.start() - 40):m.end() + 10]:
                continue
            findings.append({
                "id": fid,
                "category": category,
                "description": desc,
                "severity": severity,
                "line": line_number(text, m.start()),
            })

    has_auth_indicator = any(ind in text for ind in AUTH_INDICATORS)
    if not has_auth_indicator:
        findings.append({
            "id": "no-auth-indicator",
            "category": "Authentication",
            "description": "No recognizable auth check found in this file (session/token/auth-related identifier). "
                            "Verify whether this endpoint is meant to be public.",
            "severity": "Critical",
            "line": 1,
        })

    has_rate_limit_indicator = any(ind in text for ind in RATE_LIMIT_INDICATORS)
    mutating_method_present = any(m in methods for m in ("POST", "PUT", "PATCH", "DELETE"))
    # App Router: only worth flagging if we know a mutating/costly method is exported.
    # Pages Router: we can't reliably see the methods, so flag regardless.
    should_flag_rate_limit = (not has_rate_limit_indicator) and (mutating_method_present or not is_app_router)
    if should_flag_rate_limit:
        findings.append({
            "id": "no-rate-limit-indicator",
            "category": "Rate limiting",
            "description": "No rate-limit call found in this file. Verify whether this endpoint needs one "
                            "(size it per references/rate-limiting.md).",
            "severity": "High",
            "line": 1,
        })

    return rel, methods, is_app_router, findings


def main():
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    if not root.exists():
        print(f"Path not found: {root}")
        sys.exit(1)

    files = sorted(find_route_files(root))
    if not files:
        print(f"No app/api or pages/api route handler files found under {root}.")
        print("If routes live somewhere else, pass the correct project root as an argument.")
        sys.exit(0)

    all_results = [scan_file(f, root) for f in files]

    total_findings = sum(len(f) for _, _, _, f in all_results)
    print(f"# Endpoint Scan — {root}\n")
    print(f"Scanned {len(files)} route handler file(s), {total_findings} heuristic finding(s) to review.\n")
    print("Every finding below is a *candidate* — verify it against references/vulnerability-checklist.md "
          "before treating it as confirmed. Unflagged files still need a manual pass.\n")

    for rel, methods, is_app_router, findings in all_results:
        router = "App Router" if is_app_router else "Pages Router"
        method_str = ", ".join(methods) if methods else ("unknown — inspect req.method branching" if not is_app_router else "none exported")
        print(f"## {rel}")
        print(f"- Router: {router}")
        print(f"- Methods: {method_str}")
        if not is_app_router:
            print("- Note: Pages Router handler — verify req.method branching manually, the scanner does not parse it.")
        if findings:
            for f in sorted(findings, key=lambda x: x["line"]):
                print(f"- **[{f['severity']}] {f['category']}** (line {f['line']}, `{f['id']}`): {f['description']}")
        else:
            print("- No heuristic patterns flagged — still review manually against the checklist.")
        print()


if __name__ == "__main__":
    main()
