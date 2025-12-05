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

# ---------------------------
# CORS
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://athleterise.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(analysis_router)

# ---------------------------
# STATIC FILE MOUNTING FIX
# ---------------------------
# Render persistent disk
storage_dir = Path("/storage")
results_dir = storage_dir / "results"
uploads_dir = storage_dir / "uploads"

results_dir.mkdir(parents=True, exist_ok=True)
uploads_dir.mkdir(parents=True, exist_ok=True)

# 🚨 FIX: serve *ONE* consistent static folder at "/static"
# Everything inside /storage/results becomes available as:
#   https://backend.com/static/<filename>
app.mount("/static", StaticFiles(directory=str(results_dir)), name="static_results")

# ---------------------------
# HEALTH
# ---------------------------
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

# ---------------------------
# UPLOAD
# ---------------------------
@app.post("/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    print(f"[Upload] Received file: {file.filename}")

    if not file.filename.lower().endswith((".mp4", ".mov", ".mkv", ".avi", ".webm")):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    job_id = gen_job_id()
    print(f"[Upload] Generated job ID: {job_id}")

    try:
        saved_path = await save_upload(job_id, file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # -----------------------
    # BACKGROUND PIPELINE
    # -----------------------
    def process_and_save(job_id_local=job_id, path_local=saved_path):
        try:
            # Step 1 — Landmark extraction
            result = analyze_shot(path_local, job_id_local)
            out_path = result_path(job_id_local)

            with open(out_path, "w") as f:
                json.dump(result, f)

            # Step 2 — Overlay video + evaluation
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

        except Exception as e:
            err_path = str(Path(result_path(job_id_local)).with_suffix(".error.txt"))
            with open(err_path, "w") as ef:
                ef.write(str(e))
            print(f"[Pipeline] Error: {e}")

    background_tasks.add_task(process_and_save)

    return JSONResponse(status_code=202, content={"job_id": job_id, "status": "queued"})

# ---------------------------
# RESULT FETCH
# ---------------------------
@app.get("/result/{job_id}")
async def get_result(job_id: str):
    p = Path(result_path(job_id))
    if p.exists():
        return JSONResponse(status_code=200, content=json.loads(p.read_text()))
    else:
        return JSONResponse(status_code=404, content={"error": "result not ready"})
