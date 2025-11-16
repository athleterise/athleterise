from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import json
from pathlib import Path
import sys
import os

# Add the app directory to the path so we can import our analysis module
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.analysis.cover_drive_analyzer import analyze_cover_drive_video
from app.storage import UPLOAD_DIR, RESULT_DIR

router = APIRouter(prefix="/analyze", tags=["Analysis"])

class AnalysisRequest(BaseModel):
    job_id: str
    shot: str

@router.post("/")
async def analyze_video(request: AnalysisRequest):
    try:
        # Locate uploaded video
        upload_dir = Path(UPLOAD_DIR)
        video_files = list(upload_dir.glob(f"{request.job_id}_*"))

        if not video_files:
            raise HTTPException(status_code=404, detail="Video file not found")

        video_path = video_files[0]
        original_filename = video_path.name

        # Output directory for results
        output_dir = Path(RESULT_DIR) / "analysis"
        output_dir.mkdir(parents=True, exist_ok=True)

        # Shot-specific analysis
        if request.shot == "cover_drive":
            result = analyze_cover_drive_video(str(video_path), str(output_dir))
        else:
            # Default for now
            result = analyze_cover_drive_video(str(video_path), str(output_dir))
            result["shot_type"] = request.shot

        #
        # ----------- FIX: CLEAN & ATTACH PUBLIC URLS -----------
        #

        # Keyframe URL (returned by analyzer as local path)
        if "keyframe_path" in result and result["keyframe_path"]:
            keyframe_name = Path(result["keyframe_path"]).name
            result["keyframe_url"] = f"/static/results/{keyframe_name}"

        # Original uploaded video
        result["original_video_url"] = f"/static/uploads/{original_filename}"

        # Overlay video generated in overlay_utils.py
        overlay_file = Path(RESULT_DIR) / f"{request.job_id}_overlay.mp4"
        if overlay_file.exists():
            result["overlay_video_url"] = f"/static/results/{overlay_file.name}"
        else:
            result["overlay_video_url"] = None

        #
        # ----------- REMOVE FILESYSTEM PATHS (important) -----------
        #
        if "keyframe_path" in result:
            del result["keyframe_path"]

        if "video_path" in result:
            del result["video_path"]

        # Save results (optional)
        result_file = Path(RESULT_DIR) / f"{request.job_id}_analysis.json"
        with open(result_file, "w") as f:
            json.dump(result, f, indent=2)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
