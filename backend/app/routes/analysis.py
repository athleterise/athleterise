from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/analyze", tags=["Analysis"])

@router.post("/")
async def analyze_video(video: UploadFile = File(...)):
    # TODO: Use MediaPipe + OpenCV here later
    return {"filename": video.filename, "status": "processed"}
