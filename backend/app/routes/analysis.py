from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import json
from pathlib import Path
import sys
import os

# Allow import of analysis modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.analysis.cover_drive_analyzer import analyze_cover_drive_video

# ============================================
# Render storage directories
# ============================================
UPLOAD_DIR = Path("/storage/uploads")
RESULT_DIR = Path("/storage/results")

router = APIRouter(prefix="/analyze", tags=["Analysis"])


class AnalysisRequest(BaseModel):
    job_id: str
    shot: str


@router.post("/")
async def analyze_video(request: AnalysisRequest):
    """
    Main analysis handler.
    It loads the uploaded video, runs shot analysis,
    and returns JSON including the overlay video URL.
    """
    try:
        # -------------------------------
        # 1. Locate uploaded video file
        # -------------------------------
        video_candidates = list(UPLOAD_DIR.glob(f"{request.job_id}_*"))

        if not video_candidates:
            raise HTTPException(status_code=404, detail="Video file not found")

        video_path = video_candidates[0]

        # Ensure results folder exists
        RESULT_DIR.mkdir(parents=True, exist_ok=True)

        # -------------------------------
        # 2. Run shot-specific analysis
        # -------------------------------
        result = analyze_cover_drive_video(str(video_path), str(RESULT_DIR))
        result["shot_type"] = request.shot

        # -------------------------------
        # 3. Detect overlay files
        # -------------------------------
        overlay_mp4 = RESULT_DIR / f"{request.job_id}_overlay.mp4"
        overlay_avi = RESULT_DIR / f"{request.job_id}_overlay.avi"

        overlay_file = None
        if overlay_mp4.exists():
            overlay_file = overlay_mp4   # Preferred — our new pipeline
        elif overlay_avi.exists():
            overlay_file = overlay_avi   # Fallback if needed

        # -------------------------------
        # 4. Insert video URL for frontend
        # -------------------------------
        if overlay_file:
            # Served by main.py → app.mount("/static", results_dir)
            result["overlay_video_url"] = f"/static/{overlay_file.name}"
        else:
            result["overlay_video_url"] = None

        # Remove old / unused fields
        for unwanted in ["keyframe_path", "keyframe_url", "video_path", "overlay_video_url_old"]:
            result.pop(unwanted, None)

        # -------------------------------
        # 5. Save analysis JSON
        # -------------------------------
        result_json_path = RESULT_DIR / f"{request.job_id}_analysis.json"
        with open(result_json_path, "w") as f:
            json.dump(result, f, indent=2)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
