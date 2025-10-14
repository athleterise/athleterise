# backend/app/storage.py
from pathlib import Path
from fastapi import UploadFile
import shutil
import uuid

BASE = Path(__file__).resolve().parents[1].parent / "storage"  # backend/storage
UPLOAD_DIR = BASE / "uploads"
RESULT_DIR = BASE / "results"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)

def gen_job_id() -> str:
    return uuid.uuid4().hex

async def save_upload(job_id: str, upload_file: UploadFile) -> str:
    """Save uploaded file to disk, return saved path (str)."""
    dest = UPLOAD_DIR / f"{job_id}_{upload_file.filename}"
    # stream write to file
    with dest.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    # ensure file closed
    await upload_file.close()
    return str(dest)

def result_path(job_id: str) -> str:
    return str(RESULT_DIR / f"{job_id}_landmarks.json")
