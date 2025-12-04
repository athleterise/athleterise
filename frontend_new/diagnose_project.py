import os

ROOT = "."

print("=== DIRECTORY TREE (first 3 levels) ===")
for root, dirs, files in os.walk(ROOT):
    rel = os.path.relpath(root, ROOT)
    depth = rel.count(os.sep)
    if depth > 2:
        dirs[:] = []
        continue
    indent = "  " * depth
    print(f"{indent}{os.path.basename(root) or '.'}")
    for f in files:
        print(f"{indent}  - {f}")
print()

print("=== SEARCHING FOR FastAPI AND MediaPipe ===")
for root, dirs, files in os.walk(ROOT):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            try:
                text = open(path, "r", encoding="utf-8").read()
            except:
                continue

            # search for FastAPI usage
            if "FastAPI(" in text or "fastapi" in text.lower():
                print("[FastAPI FOUND]", path)

            # search for MediaPipe usage
            if "mediapipe" in text.lower():
                print("[MediaPipe FOUND]", path)

print("\n=== DONE ===")
