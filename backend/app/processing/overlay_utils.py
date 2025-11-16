# backend/app/processing/overlay_utils.py

import cv2
import mediapipe as mp
import numpy as np
import json
from pathlib import Path

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


def calculate_angle(a, b, c):
    """Calculate the angle (in degrees) at point b formed by points a-b-c."""
    a, b, c = np.array(a), np.array(b), np.array(c)
    ab, cb = a - b, c - b
    cosine = np.dot(ab, cb) / (np.linalg.norm(ab) * np.linalg.norm(cb))
    return np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))


def generate_overlay_video(video_path: str, landmarks_json_path: str, output_path: str):
    """
    Processes a video frame-by-frame, runs pose detection, overlays skeletons, metrics,
    and feedback text. Returns the path to the generated .issues.json file.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    pose = mp_pose.Pose(static_image_mode=False, model_complexity=1,
                        min_detection_confidence=0.5, min_tracking_confidence=0.5)
    # Force WebM VP9 output since H264 is not available on Render
    output_path = str(Path(output_path).with_suffix(".webm"))

    fourcc = cv2.VideoWriter_fourcc(*'VP90')
    out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))


    persistent_issues = {}

    def draw_text(frame, text, position, font_scale=1.0, color=(0, 0, 0), thickness=2):
        """Draw text with a white outline for better visibility."""
        x, y = position
        cv2.putText(frame, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX,
                    font_scale, (255, 255, 255), thickness + 2, cv2.LINE_AA)
        cv2.putText(frame, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX,
                    font_scale, color, thickness, cv2.LINE_AA)

    def log_issue(issue, t):
        """Log feedback issues along with timestamps."""
        if issue not in persistent_issues:
            persistent_issues[issue] = []
        ts = round(float(t), 1)
        if ts not in persistent_issues[issue]:
            persistent_issues[issue].append(ts)

    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        time_sec = frame_count / fps
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if results.pose_landmarks:
            lm = results.pose_landmarks.landmark

            def pt(idx):
                return [lm[idx].x * frame_width, lm[idx].y * frame_height]

            # --- Key joints ---
            shoulder, elbow, wrist = map(pt, [mp_pose.PoseLandmark.LEFT_SHOULDER.value,
                                              mp_pose.PoseLandmark.LEFT_ELBOW.value,
                                              mp_pose.PoseLandmark.LEFT_WRIST.value])
            hip, knee, ankle = map(pt, [mp_pose.PoseLandmark.LEFT_HIP.value,
                                        mp_pose.PoseLandmark.LEFT_KNEE.value,
                                        mp_pose.PoseLandmark.LEFT_ANKLE.value])
            nose = pt(mp_pose.PoseLandmark.NOSE.value)

            # --- Metrics ---
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

            # --- Pose Skeleton ---
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

            # --- HUD Metrics ---
            hud_y = 30
            spacing = 25
            draw_text(frame, f'Elbow: {elbow_angle} deg', (10, hud_y), font_scale=0.6)
            draw_text(frame, f'Spine: {spine_angle} deg', (10, hud_y + spacing), font_scale=0.6)
            draw_text(frame, f'Head-Knee X: {head_knee_dx}px', (10, hud_y + 2 * spacing), font_scale=0.6)
            draw_text(frame, f'Foot Dir: {foot_angle} deg', (10, hud_y + 3 * spacing), font_scale=0.6)

            # --- Feedback Logic ---
            msg = ""
            if not 100 <= elbow_angle <= 145:
                msg = "Adjust your elbow angle"
                log_issue("Elbow angle needs improvement", time_sec)
            elif not 10 <= spine_angle <= 25:
                msg = "Maintain spine balance"
                log_issue("Posture is inconsistent", time_sec)
            elif head_knee_dx > 50:
                msg = "Bring head over front knee"
                log_issue("Head not aligned over knee", time_sec)
            elif foot_angle >= 45:
                msg = "Point front foot forward"
                log_issue("Front foot alignment off", time_sec)
            else:
                msg = "Good posture!"

            # --- Centered Live Message ---
            text_size = cv2.getTextSize(msg, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 2)[0]
            feedback_x = int(nose[0] - text_size[0] // 2)
            feedback_x = max(10, min(feedback_x, frame_width - text_size[0] - 10))
            feedback_y = int(min(nose[1] + 140, frame_height - 20))
            draw_text(frame, msg, (feedback_x, feedback_y), font_scale=1.2)

            # --- Persistent Feedback (Top-right) ---
            y_offset = 40
            for i, (issue, times) in enumerate(sorted(persistent_issues.items())):
                sorted_times = sorted(times)
                if not sorted_times:
                    continue
                duration = f"[{sorted_times[0]}s]" if len(sorted_times) == 1 else f"[{sorted_times[0]}s - {sorted_times[-1]}s]"
                draw_text(frame, f"- {issue} {duration}",
                          (frame_width - 470, y_offset), font_scale=0.6, color=(0, 0, 0))
                y_offset += 25

        out.write(frame)
        frame_count += 1

    cap.release()
    out.release()
    pose.close()

    # --- Save issues log ---
    issues_path = str(Path(output_path).with_suffix(".issues.json"))
    with open(issues_path, "w") as f:
        json.dump(persistent_issues, f, indent=2)

    print(f"[Overlay] Saved annotated video: {output_path}")
    print(f"[Overlay] Saved issues log: {issues_path}")
    return issues_path


def generate_evaluation_json(issue_log_path: str, output_json_path: str):
    """
    Reads the .issues.json log, scores each category, and saves a summarized evaluation JSON.
    """
    with open(issue_log_path) as f:
        issues = json.load(f)

    def evaluate_category(key, desc):
        t = issues.get(key, [])
        if not t:
            return 10, f"✅ Excellent. {desc}"
        elif len(t) <= 2:
            return 8, f"⚠️ Minor inconsistency. {desc}"
        elif len(t) <= 5:
            return 6, f"❌ Needs improvement. {desc}"
        else:
            return 4, f"❌ Major issue observed repeatedly. {desc}"

    evaluation = {
        "Footwork": dict(zip(("score", "feedback"),
                             evaluate_category("Front foot alignment off",
                                               "Front foot should point more toward the direction of the shot."))),
        "Head Position": dict(zip(("score", "feedback"),
                                  evaluate_category("Head not aligned over knee",
                                                    "Keeping the head above the front knee improves balance and timing."))),
        "Balance": dict(zip(("score", "feedback"),
                            evaluate_category("Posture is inconsistent",
                                              "Maintain a consistent forward lean with a stable spine."))),
        "Swing Control": {"score": None, "feedback": "Not evaluated — bat tracking not implemented."},
        "Follow-through": {"score": None, "feedback": "Not evaluated — follow-through not measured."}
    }

    with open(output_json_path, "w") as f:
        json.dump(evaluation, f, indent=4)

    print(f"[Evaluation] Saved summary: {output_json_path}")
