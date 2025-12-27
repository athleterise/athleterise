from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
from pathlib import Path
import sys
import os

# Allow import of analysis modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Shot-specific analyzers
from app.analysis.cover_drive_analyzer import analyze_cover_drive_video
from app.analysis.pull_shot_analyzer import analyze_pull_shot_video
from app.analysis.cut_shot_analyzer import analyze_cut_shot_video
from app.analysis.straight_drive_analyzer import analyze_straight_drive_video

# ============================================
# Render storage directories
# ============================================
UPLOAD_DIR = Path("/storage/uploads")
RESULT_DIR = Path("/storage/results")

router = APIRouter(prefix="/analyze", tags=["Analysis"])


class AnalysisRequest(BaseModel):
    job_id: str
    shot: str


SHOT_ANALYZERS = {
    "cover_drive": analyze_cover_drive_video,
    "pull_shot": analyze_pull_shot_video,
    "cut_shot": analyze_cut_shot_video,
    "straight_drive": analyze_straight_drive_video,
}


@router.post("/")
async def analyze_video(request: AnalysisRequest):
    try:
        # -------------------------------
        # 1. Locate uploaded video
        # -------------------------------
        video_candidates = list(UPLOAD_DIR.glob(f"{request.job_id}_*"))
        if not video_candidates:
            raise HTTPException(status_code=404, detail="Video file not found")

        video_path = video_candidates[0]
        RESULT_DIR.mkdir(parents=True, exist_ok=True)

        # -------------------------------
        # 2. Select correct analyzer
        # -------------------------------
        analyzer = SHOT_ANALYZERS.get(request.shot)
        if not analyzer:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported shot type: {request.shot}",
            )

        result = analyzer(str(video_path), str(RESULT_DIR))
        result["shot_type"] = request.shot

        # -------------------------------
        # 3. Detect overlay video
        # -------------------------------
        overlay_mp4 = RESULT_DIR / f"{request.job_id}_overlay.mp4"
        overlay_avi = RESULT_DIR / f"{request.job_id}_overlay.avi"

        overlay_file = overlay_mp4 if overlay_mp4.exists() else (
            overlay_avi if overlay_avi.exists() else None
        )

        result["overlay_video_url"] = (
            f"/static/{overlay_file.name}" if overlay_file else None
        )

        # -------------------------------
        # 4. Save analysis JSON
        # -------------------------------
        result_json_path = RESULT_DIR / f"{request.job_id}_analysis.json"
        with open(result_json_path, "w") as f:
            json.dump(result, f, indent=2)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
