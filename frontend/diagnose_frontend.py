import os
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


# 1. Detect Framework Structure
section("1. DIRECTORY STRUCTURE CHECK")

expected_dirs = ["src", "components", "pages", "public"]
for d in expected_dirs:
    p = ROOT / d
    print(f"{d}: {'FOUND' if p.exists() else 'missing'}")


# 2. Read package.json
section("2. PACKAGE.JSON CONTENT")

package_json_path = ROOT / "package.json"
if package_json_path.exists():
    try:
        with open(package_json_path, "r", encoding="utf-8") as f:
            pkg = json.load(f)

        print("name:", pkg.get("name"))
        print("version:", pkg.get("version"))
        print("\nSCRIPTS:")
        for k, v in pkg.get("scripts", {}).items():
            print(f"  {k}: {v}")

        print("\nDEPENDENCIES:")
        for k, v in pkg.get("dependencies", {}).items():
            print(f"  {k}: {v}")

    except Exception as e:
        print("Error reading package.json:", e)
else:
    print("package.json NOT FOUND")


# 3. Detect API Calls in JS/TS files
section("3. API CALL DETECTION (fetch/axios/base URLs)")

patterns = {
    "axios": re.compile(r"axios\.(get|post|put|delete)\(", re.I),
    "fetch": re.compile(r"fetch\(", re.I),
    "localhost": re.compile(r"localhost[:/]", re.I),
    "127.0.0.1": re.compile(r"127\.0\.0\.1", re.I),
}

api_hits = []

for root, dirs, files in os.walk(ROOT):
    for fname in files:
        if fname.endswith((".js", ".ts", ".jsx", ".tsx")):
            full = Path(root) / fname
            try:
                text = full.read_text(encoding="utf-8", errors="ignore")
                for label, pattern in patterns.items():
                    if pattern.search(text):
                        api_hits.append((label, str(full)))
            except:
                pass

if api_hits:
    print("Detected API-related code:")
    for label, path in api_hits:
        print(f"  [{label}] → {path}")
else:
    print("No API calls detected OR scanning failed.")


# 4. Check for environment files
section("4. ENVIRONMENT FILES")

env_files = [".env", ".env.local", ".env.production"]

for ef in env_files:
    ef_path = ROOT / ef
    print(f"{ef}: {'FOUND' if ef_path.exists() else 'missing'}")


section("END OF REPORT")
