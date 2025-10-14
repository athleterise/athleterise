from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from app.storage import gen_job_id, save_upload, result_path
from app.processing.mediapipe_utils import analyze_shot
import json
import asyncio
from pathlib import Path

app = FastAPI(title="AthleteRise Backend - MVP")

@app.post("/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # basic validation
    if not file.filename.lower().endswith((".mp4", ".mov", ".mkv", ".avi", ".webm")):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    job_id = gen_job_id()
    saved_path = await save_upload(job_id, file)  # saves and closes upload file

    # background processing function
    def process_and_save(job_id_local=job_id, path_local=saved_path):
        try:
            result = analyze_shot(path_local, job_id_local)
            out_path = result_path(job_id_local)
            with open(out_path, "w") as f:
                json.dump(result, f)
        except Exception as e:
            # log / persist error (simplest: write error file)
            err_path = str(Path(result_path(job_id_local)).with_suffix(".error.txt"))
            with open(err_path, "w") as ef:
                ef.write(str(e))

    background_tasks.add_task(process_and_save)

    return JSONResponse(status_code=202, content={"job_id": job_id, "status": "queued"})

@app.get("/result/{job_id}")
async def get_result(job_id: str):
    p = Path(result_path(job_id))
    if p.exists():
        return JSONResponse(status_code=200, content=json.loads(p.read_text()))
    else:
        return JSONResponse(status_code=404, content={"error": "result not ready"})
