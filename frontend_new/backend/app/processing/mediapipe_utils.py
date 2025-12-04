import cv2
import mediapipe as mp
import math
import json
from typing import List, Dict, Any

mp_pose = mp.solutions.pose

def _landmarks_to_list(landmark_list, width, height):
    out = []
    for lm in landmark_list.landmark:
        out.append({"x": lm.x, "y": lm.y, "z": lm.z, "visibility": getattr(lm, "visibility", None)})
    return out

def analyze_shot(video_path: str, job_id: str, max_frames: int = None) -> Dict[str, Any]:
    """
    Process a video and extract per-frame pose landmarks.
    Returns a dict (serializable) with frames -> landmarks and meta.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    results = {
        "job_id": job_id,
        "fps": fps,
        "frame_count": total_frames,
        "frames": []
    }

    pose = mp_pose.Pose(static_image_mode=False, model_complexity=1,
                        min_detection_confidence=0.5, min_tracking_confidence=0.5)

    frame_idx = 0
    sample_rate = 1  # 1 => every frame, set to 2 to sample every other frame for speed
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if max_frames and frame_idx >= max_frames:
            break

        if frame_idx % sample_rate == 0:
            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = pose.process(rgb)
            data = {"frame": frame_idx, "pose": None}
            if res.pose_landmarks:
                data["pose"] = _landmarks_to_list(res.pose_landmarks, w, h)
            results["frames"].append(data)

        frame_idx += 1

    cap.release()
    pose.close()
    return results
