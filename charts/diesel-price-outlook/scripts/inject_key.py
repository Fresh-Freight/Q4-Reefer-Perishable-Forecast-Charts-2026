"""
Replace the __EIA_API_KEY__ placeholder in docs/index.html with the real
key from the EIA_API_KEY environment variable. Run by GitHub Actions
during the build step.
"""

import os
import sys
from pathlib import Path

PLACEHOLDER = "__EIA_API_KEY__"
DEFAULT_HTML_PATH = Path(__file__).resolve().parent.parent / "docs" / "index.html"


def main() -> int:
    # Optional path argument. In the shared monorepo the build stages a copy of
    # docs/index.html first and injects into that, so the real key never lands
    # in a git-tracked file. Standalone runs use the default and rely on the
    # deploy artifact being discarded after publish.
    html_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_HTML_PATH

    api_key = os.environ.get("EIA_API_KEY", "").strip()
    if not api_key:
        print("WARNING: EIA_API_KEY not set — deploying with fallback data only.")
        return 0

    if not html_path.exists():
        print(f"ERROR: {html_path} not found.", file=sys.stderr)
        return 1

    html = html_path.read_text(encoding="utf-8")

    if PLACEHOLDER not in html:
        print(f"ERROR: Placeholder {PLACEHOLDER!r} not found in HTML. Was the key already injected?", file=sys.stderr)
        return 1

    html = html.replace(PLACEHOLDER, api_key)
    html_path.write_text(html, encoding="utf-8")
    print(f"Injected EIA API key into {html_path.name} (length: {len(api_key)} chars).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
