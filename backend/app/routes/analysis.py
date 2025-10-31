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
    """
    Analyze a previously uploaded video for the specified shot type.
    """
    try:
        # Find the uploaded video file
        upload_dir = Path(UPLOAD_DIR)
        video_files = list(upload_dir.glob(f"{request.job_id}_*"))
        
        if not video_files:
            raise HTTPException(status_code=404, detail="Video file not found")
        
        video_path = str(video_files[0])
        
        # Create output directory for analysis results
        output_dir = Path(RESULT_DIR) / "analysis"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Analyze based on shot type
        if request.shot == "cover_drive":
            result = analyze_cover_drive_video(video_path, str(output_dir))
        else:
            # For now, default to cover drive analysis
            result = analyze_cover_drive_video(video_path, str(output_dir))
            result['shot_type'] = request.shot
        
        # Save analysis results
        result_file = Path(RESULT_DIR) / f"{request.job_id}_analysis.json"
        with open(result_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
