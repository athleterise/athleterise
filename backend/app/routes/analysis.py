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

# ===============================
# FIX: Use Render storage folders
# ===============================
UPLOAD_DIR = "/storage/uploads"
RESULT_DIR = "/storage/results"

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
        output_dir = Path(RESULT_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Shot-specific analysis
        if request.shot == "cover_drive":
            result = analyze_cover_drive_video(str(video_path), str(output_dir))
        else:
            result = analyze_cover_drive_video(str(video_path), str(output_dir))
            result["shot_type"] = request.shot

        # ----------- RETURN ONLY THE ANNOTATED VIDEO PATH -------------

        # Detect overlay video (prefer .avi since that's what is generated)
        overlay_avi = Path(RESULT_DIR) / f"{request.job_id}_overlay.avi"
        overlay_mp4 = Path(RESULT_DIR) / f"{request.job_id}_overlay.mp4"

        if overlay_mp4.exists():
            overlay_file = overlay_mp4
        elif overlay_avi.exists():
            overlay_file = overlay_avi
        else:
            overlay_file = None

        # Provide ONLY the field expected by the frontend
        if overlay_file:
            # Frontend constructs: backendUrl + "/static/" + video_path
            result["video_path"] = f"results/{overlay_file.name}"
        else:
            result["video_path"] = None

        # Clean up any other fields we do not want to expose
        if "keyframe_path" in result:
            del result["keyframe_path"]
        if "keyframe_url" in result:
            del result["keyframe_url"]
        if "overlay_video_url" in result:
            del result["overlay_video_url"]

        # Save results
        result_file = Path(RESULT_DIR) / f"{request.job_id}_analysis.json"
        with open(result_file, "w") as f:
            json.dump(result, f, indent=2)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
