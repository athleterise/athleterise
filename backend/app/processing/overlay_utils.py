import cv2
import mediapipe as mp
import numpy as np
import json
import subprocess
from pathlib import Path

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ab, cb = a - b, c - b
    cosine = np.dot(ab, cb) / (np.linalg.norm(ab) * np.linalg.norm(cb))
    return np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))


def generate_overlay_video(video_path: str, landmarks_json_path: str, output_path: str):
    """
    CPU-safe overlay → AVI → optimized MP4.
    Works reliably on Render 1 vCPU.
    """

    output_path = Path(output_path)

    # Always generate AVI first
    avi_path = output_path.with_suffix(".avi")
    mp4_path = output_path.with_suffix(".mp4")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25

    avi_fourcc = cv2.VideoWriter_fourcc(*"XVID")
    out = cv2.VideoWriter(str(avi_path), avi_fourcc, fps, (frame_width, frame_height))

    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    persistent_issues = {}

    def draw_text(frame, text, pos, font_scale=1.0, color=(0, 0, 0), thickness=2):
        x, y = pos
        cv2.putText(frame, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX,
                    font_scale, (255, 255, 255), thickness+2, cv2.LINE_AA)
        cv2.putText(frame, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX,
                    font_scale, color, thickness, cv2.LINE_AA)

    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if results.pose_landmarks:
            lm = results.pose_landmarks.landmark

            def pt(i):
                return [lm[i].x * frame_width, lm[i].y * frame_height]

            shoulder = pt(mp_pose.PoseLandmark.LEFT_SHOULDER.value)
            elbow = pt(mp_pose.PoseLandmark.LEFT_ELBOW.value)
            wrist = pt(mp_pose.PoseLandmark.LEFT_WRIST.value)
            hip = pt(mp_pose.PoseLandmark.LEFT_HIP.value)
            knee = pt(mp_pose.PoseLandmark.LEFT_KNEE.value)
            ankle = pt(mp_pose.PoseLandmark.LEFT_ANKLE.value)
            nose = pt(mp_pose.PoseLandmark.NOSE.value)

            elbow_angle = int(calculate_angle(shoulder, elbow, wrist))

            spine_vec = np.array(shoulder) - np.array(hip)
            spine_unit = spine_vec / np.linalg.norm(spine_vec)
            spine_angle = int(np.degrees(np.arccos(np.clip(np.dot(spine_unit, [0, -1]), -1.0, 1.0))))

            head_knee_dx = int(abs(nose[0] - knee[0]))

            leg_vec = np.array(ankle) - np.array(knee)
            leg_unit = leg_vec / np.linalg.norm(leg_vec)
            foot_angle = int(np.degrees(np.arccos(np.clip(np.dot(leg_unit, [1, 0]), -1.0, 1.0))))
            if foot_angle > 90:
                foot_angle = 180 - foot_angle

            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

            draw_text(frame, f"Elbow: {elbow_angle}°", (10, 30), 0.6)
            draw_text(frame, f"Spine: {spine_angle}°", (10, 55), 0.6)
            draw_text(frame, f"Head-Knee X: {head_knee_dx}px", (10, 80), 0.6)
            draw_text(frame, f"Foot Dir: {foot_angle}°", (10, 105), 0.6)

        out.write(frame)
        frame_count += 1

    cap.release()
    out.release()
    pose.close()

    # ---------------------------------------------------
    # CPU-SAFE MP4 CONVERSION (1 thread, ultrafast, CRF 32)
    # ---------------------------------------------------
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", str(avi_path),
        "-vcodec", "libx264",
        "-preset", "ultrafast",
        "-crf", "32",
        "-pix_fmt", "yuv420p",   # browser safe
        "-threads", "1",         # do NOT spike CPU
        str(mp4_path),
    ]

    subprocess.run(ffmpeg_cmd)

    # Validate output
    if mp4_path.exists() and mp4_path.stat().st_size > 1000:
        avi_path.unlink(missing_ok=True)  # cleanup
    else:
        # MP4 failed → keep AVI as fallback
        mp4_path.unlink(missing_ok=True)
        mp4_path = avi_path

    # Save issues log
    issues_path = str(mp4_path.with_suffix(".issues.json"))
    with open(issues_path, "w") as f:
        json.dump(persistent_issues, f, indent=2)

    return issues_path


def generate_evaluation_json(issue_log_path: str, output_json_path: str):
    with open(issue_log_path) as f:
        issues = json.load(f)

    def evaluate(key, desc):
        t = issues.get(key, [])
        if not t:
            return 10, f"Excellent. {desc}"
        elif len(t) <= 2:
            return 8, f"Minor inconsistency. {desc}"
        elif len(t) <= 5:
            return 6, f"Needs improvement. {desc}"
        else:
            return 4, f"Major issue. {desc}"

    evaluation = {
        "Footwork": {
            "score": evaluate("Front foot alignment off",
                              "Front foot should point toward shot.")[0],
            "feedback": evaluate("Front foot alignment off",
                                 "Front foot should point toward shot.")[1],
        },
        "Head Position": {
            "score": evaluate("Head not aligned over knee",
                              "Head should be above front knee.")[0],
            "feedback": evaluate("Head not aligned over knee",
                                 "Head should be above front knee.")[1],
        },
        "Balance": {
            "score": evaluate("Posture is inconsistent",
                              "Maintain stable spine posture.")[0],
            "feedback": evaluate("Posture is inconsistent",
                                 "Maintain stable spine posture.")[1],
        },
        "Swing Control": {"score": None, "feedback": "Not implemented"},
        "Follow-through": {"score": None, "feedback": "Not implemented"},
    }

    with open(output_json_path, "w") as f:
        json.dump(evaluation, f, indent=4)
