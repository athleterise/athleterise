from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.storage import gen_job_id, save_upload, result_path
from app.processing.mediapipe_utils import analyze_shot
from app.routes.analysis import router as analysis_router
import json
from pathlib import Path

app = FastAPI(title="AthleteRise Backend - MVP")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include analysis router
app.include_router(analysis_router)

# Mount static files for serving analysis images
from pathlib import Path
static_dir = Path(__file__).parent.parent.parent / "storage" / "results"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}


@app.post("/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    print(f"[Upload] Received file: {file.filename}")
    
    # === Basic validation ===
    if not file.filename.lower().endswith((".mp4", ".mov", ".mkv", ".avi", ".webm")):
        print(f"[Upload] Invalid file type: {file.filename}")
        raise HTTPException(status_code=400, detail="Unsupported file type")

    job_id = gen_job_id()
    print(f"[Upload] Generated job ID: {job_id}")
    
    try:
        saved_path = await save_upload(job_id, file)  # saves uploaded file locally
        print(f"[Upload] File saved to: {saved_path}")
    except Exception as e:
        print(f"[Upload] Error saving file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # === Background processing function ===
    def process_and_save(job_id_local=job_id, path_local=saved_path):
        try:
            # Step 1 — Run landmark extraction and save JSON
            result = analyze_shot(path_local, job_id_local)
            out_path = result_path(job_id_local)
            with open(out_path, "w") as f:
                json.dump(result, f)

            # Step 2 — Generate overlay video and evaluation report
            from app.processing.overlay_utils import (
                generate_overlay_video,
                generate_evaluation_json,
            )

            overlay_output = str(Path(out_path).with_name(f"{job_id_local}_overlay.mp4"))
            issues_path = generate_overlay_video(
                video_path=path_local,
                landmarks_json_path=out_path,
                output_path=overlay_output,
            )

            evaluation_path = str(Path(out_path).with_name(f"{job_id_local}_evaluation.json"))
            generate_evaluation_json(issues_path, evaluation_path)

            print(f"[Pipeline] Completed all outputs for job {job_id_local}")

        except Exception as e:
            # Step 3 — Log any processing error
            err_path = str(Path(result_path(job_id_local)).with_suffix(".error.txt"))
            with open(err_path, "w") as ef:
                ef.write(str(e))
            print(f"[Pipeline] Error in job {job_id_local}: {e}")

    # === Queue background processing ===
    background_tasks.add_task(process_and_save)

    return JSONResponse(status_code=202, content={"job_id": job_id, "status": "queued"})


@app.get("/result/{job_id}")
async def get_result(job_id: str):
    """
    Returns the JSON landmark data for the given job_id if available.
    """
    p = Path(result_path(job_id))
    if p.exists():
        return JSONResponse(status_code=200, content=json.loads(p.read_text()))
    else:
        return JSONResponse(status_code=404, content={"error": "result not ready"})
