from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
import sys
import os
import shutil  # ← ADDED

# Allow import of analysis modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# -------------------------------
# Import shot-specific analyzers
# -------------------------------
from app.analysis.cover_drive_analyzer import analyze_cover_drive_video
from app.analysis.straight_drive_analyzer import analyze_straight_drive_video
from app.analysis.pull_shot_analyzer import analyze_pull_shot_video
from app.analysis.cut_shot_analyzer import analyze_cut_shot_video

# ============================================
# Render storage directories
# ============================================
UPLOAD_DIR = Path("/storage/uploads")
RESULT_DIR = Path("/storage/results")

router = APIRouter(prefix="/analyze", tags=["Analysis"])


class AnalysisRequest(BaseModel):
    job_id: str
    shot: str


# -------------------------------
# Shot → Analyzer routing table
# -------------------------------
ANALYZER_MAP = {
    "cover_drive": analyze_cover_drive_video,
    "straight_drive": analyze_straight_drive_video,
    "pull_shot": analyze_pull_shot_video,
    "cut_shot": analyze_cut_shot_video,
}


@router.post("/")
async def analyze_video(request: AnalysisRequest):
    """
    Main analysis handler.
    Selects shot-specific analyzer, generates metrics,
    feedback, keyframe, and returns overlay video URL.
    """
    try:
        # -------------------------------
        # 1. Locate uploaded video
        # -------------------------------
        video_candidates = list(UPLOAD_DIR.glob(f"{request.job_id}_*"))
        if not video_candidates:
            raise HTTPException(status_code=404, detail="Video file not found")

        video_path = video_candidates[0]

        # Ensure results folder exists
        RESULT_DIR.mkdir(parents=True, exist_ok=True)

        # -------------------------------
        # 2. Select correct analyzer
        # -------------------------------
        analyzer = ANALYZER_MAP.get(request.shot)
        if analyzer is None:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported shot type: {request.shot}",
            )

        # -------------------------------
        # 3. Run shot-specific analysis
        # -------------------------------
        result = analyzer(str(video_path), str(RESULT_DIR))
        result["shot_type"] = request.shot

        # -------------------------------
        # 4. Detect overlay files
        # -------------------------------
        overlay_mp4 = RESULT_DIR / f"{request.job_id}_overlay.mp4"
        overlay_avi = RESULT_DIR / f"{request.job_id}_overlay.avi"

        overlay_file = None
        if overlay_mp4.exists():
            overlay_file = overlay_mp4
        elif overlay_avi.exists():
            overlay_file = overlay_avi

        # -------------------------------
        # 5. Insert overlay URL
        # -------------------------------
        if overlay_file:
            result["overlay_video_url"] = f"/static/{overlay_file.name}"
        else:
            result["overlay_video_url"] = None

        # -------------------------------
        # 6. 🔥 KEYFRAME FIX (ADDED)
        # -------------------------------
        # Analyzer returns something like ".../<video_stem>_keyframe.jpg"
        src_keyframe = result.get("keyframe_path")
        if src_keyframe and Path(src_keyframe).exists():
            stable_keyframe = RESULT_DIR / f"{request.job_id}_keyframe.jpg"
            shutil.copyfile(src_keyframe, stable_keyframe)
            result["keyframe_url"] = f"/static/{stable_keyframe.name}"
        else:
            result["keyframe_url"] = None

        # -------------------------------
        # 7. Clean legacy fields (UNCHANGED)
        # -------------------------------
        for unwanted in [
            "video_path",
            "overlay_video_url_old",
        ]:
            result.pop(unwanted, None)

        # -------------------------------
        # 8. Save analysis JSON
        # -------------------------------
        result_json_path = RESULT_DIR / f"{request.job_id}_analysis.json"
        with open(result_json_path, "w") as f:
            json.dump(result, f, indent=2)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
