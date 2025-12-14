
import cv2
import mediapipe as mp
import numpy as np
import json
import math
from typing import Dict, List, Tuple, Any
from pathlib import Path

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles


class CoverDriveAnalyzer:
    """Analyzes cover drive shots for biomechanical metrics and provides feedback."""
    
    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Ideal ranges for cover drive metrics
        self.ideal_ranges = {
            'front_elbow_angle': (150, 170),
            'back_elbow_angle': (70, 100),
            'torso_lean': (10, 25),
            'shoulder_alignment': (15, 30),
            'front_knee_angle': (80, 100),
            'back_knee_angle': (120, 150),
            'hip_rotation': (30, 50),
            'wrist_angle': (150, 170),
            'head_position': (-5, 5),  # percentage offset
            'center_of_mass': (0, 10)  # percentage over front foot
        }
        
        # Acceptable ranges (wider than ideal)
        self.acceptable_ranges = {
            'front_elbow_angle': (140, 175),
            'back_elbow_angle': (60, 110),
            'torso_lean': (5, 30),
            'shoulder_alignment': (10, 35),
            'front_knee_angle': (70, 110),
            'back_knee_angle': (110, 160),
            'hip_rotation': (20, 60),
            'wrist_angle': (140, 175),
            'head_position': (-10, 10),
            'center_of_mass': (-5, 15)
        }

    def calculate_angle(self, point1: np.ndarray, point2: np.ndarray, point3: np.ndarray) -> float:
        """Calculate angle between three points in degrees."""
        vector1 = point1 - point2
        vector2 = point3 - point2
        
        # Calculate angle using dot product
        cos_angle = np.dot(vector1, vector2) / (np.linalg.norm(vector1) * np.linalg.norm(vector2))
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = np.degrees(np.arccos(cos_angle))
        
        return angle

    def detect_keyframe(self, video_path: str) -> Tuple[int, np.ndarray]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        wrist_positions = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb)
            
            if results.pose_landmarks:
                left_wrist = results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST]
                wrist_positions.append((frame_count, left_wrist.x, left_wrist.y))
            
            frame_count += 1
        
        cap.release()
        
        if len(wrist_positions) < 10:
            cap = cv2.VideoCapture(video_path)
            cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames // 2)
            ret, frame = cap.read()
            cap.release()
            return total_frames // 2, frame
        
        # Calculate wrist velocity
        velocities = []
        for i in range(1, len(wrist_positions)):
            prev_frame, prev_x, prev_y = wrist_positions[i-1]
            curr_frame, curr_x, curr_y = wrist_positions[i]
            
            # Calculate velocity (pixels per frame)
            velocity = math.sqrt((curr_x - prev_x)**2 + (curr_y - prev_y)**2)
            velocities.append((curr_frame, velocity))
        
        # Find frame with maximum velocity (impact moment)
        if velocities:
            keyframe_idx, _ = max(velocities, key=lambda x: x[1])
        else:
            keyframe_idx = total_frames // 2
        
        # Get the keyframe
        cap = cv2.VideoCapture(video_path)
        cap.set(cv2.CAP_PROP_POS_FRAMES, keyframe_idx)
        ret, keyframe = cap.read()
        cap.release()
        
        return keyframe_idx, keyframe

    def extract_landmarks(self, frame: np.ndarray) -> Dict[str, Any]:
        """Extract pose landmarks from a frame."""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)
        
        if not results.pose_landmarks:
            return None
        
        landmarks = {}
        for landmark in mp_pose.PoseLandmark:
            lm = results.pose_landmarks.landmark[landmark.value]
            landmarks[landmark.name] = {
                'x': lm.x,
                'y': lm.y,
                'z': lm.z,
                'visibility': lm.visibility
            }
        
        return landmarks

    def calculate_metrics(self, landmarks: Dict[str, Any], frame_shape: Tuple[int, int]) -> Dict[str, float]:
        """Calculate all biomechanical metrics for cover drive analysis."""
        height, width = frame_shape
        
        def get_point(landmark_name: str) -> np.ndarray:
            lm = landmarks[landmark_name]
            return np.array([lm['x'] * width, lm['y'] * height])
        
        metrics = {}
        
        try:
            # Arm mechanics
            left_shoulder = get_point('LEFT_SHOULDER')
            left_elbow = get_point('LEFT_ELBOW')
            left_wrist = get_point('LEFT_WRIST')
            right_shoulder = get_point('RIGHT_SHOULDER')
            right_elbow = get_point('RIGHT_ELBOW')
            right_wrist = get_point('RIGHT_WRIST')
            
            # Front elbow angle (left arm for right-handed batsman)
            metrics['front_elbow_angle'] = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
            
            # Back elbow angle (right arm)
            metrics['back_elbow_angle'] = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
            
            # Torso and shoulder
            left_hip = get_point('LEFT_HIP')
            right_hip = get_point('RIGHT_HIP')
            hip_center = (left_hip + right_hip) / 2
            shoulder_center = (left_shoulder + right_shoulder) / 2
            
            # Torso lean (spine angle from vertical)
            spine_vector = shoulder_center - hip_center
            vertical = np.array([0, -1])
            spine_angle = np.degrees(np.arccos(np.clip(
                np.dot(spine_vector, vertical) / np.linalg.norm(spine_vector), -1, 1
            )))
            metrics['torso_lean'] = spine_angle
            
            # Shoulder alignment (rotation)
            shoulder_line = right_shoulder - left_shoulder
            horizontal = np.array([1, 0])
            shoulder_angle = np.degrees(np.arccos(np.clip(
                np.dot(shoulder_line, horizontal) / np.linalg.norm(shoulder_line), -1, 1
            )))
            metrics['shoulder_alignment'] = shoulder_angle
            
            # Lower body
            left_knee = get_point('LEFT_KNEE')
            left_ankle = get_point('LEFT_ANKLE')
            right_knee = get_point('RIGHT_KNEE')
            right_ankle = get_point('RIGHT_ANKLE')
            
            # Front knee angle (left leg for right-handed batsman)
            metrics['front_knee_angle'] = self.calculate_angle(left_hip, left_knee, left_ankle)
            
            # Back knee angle (right leg)
            metrics['back_knee_angle'] = self.calculate_angle(right_hip, right_knee, right_ankle)
            
            # Hip rotation
            hip_vector = right_hip - left_hip
            hip_angle = np.degrees(np.arccos(np.clip(
                np.dot(hip_vector, horizontal) / np.linalg.norm(hip_vector), -1, 1
            )))
            metrics['hip_rotation'] = hip_angle
            
            # Wrist angle (approximation using elbow-wrist-hand)
            # For wrist angle, we need hand landmarks, using wrist as approximation
            metrics['wrist_angle'] = self.calculate_angle(left_elbow, left_wrist, left_wrist + np.array([1, 0]))
            
            # Head position relative to front knee
            nose = get_point('NOSE')
            head_knee_offset = ((nose[0] - left_knee[0]) / width) * 100
            metrics['head_position'] = head_knee_offset
            
            # Center of mass (approximation using hip position)
            hip_center_x = hip_center[0]
            left_ankle_x = left_ankle[0]
            right_ankle_x = right_ankle[0]
            foot_center_x = (left_ankle_x + right_ankle_x) / 2
            com_offset = ((hip_center_x - foot_center_x) / width) * 100
            metrics['center_of_mass'] = com_offset
            
        except Exception as e:
            print(f"Error calculating metrics: {e}")
            # Return default values if calculation fails
            for key in self.ideal_ranges.keys():
                metrics[key] = 0.0
        
        return metrics

    def generate_feedback(self, metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Generate feedback based on calculated metrics."""
        feedback = []
        
        for metric_name, value in metrics.items():
            ideal_min, ideal_max = self.ideal_ranges[metric_name]
            acceptable_min, acceptable_max = self.acceptable_ranges[metric_name]
            
            if ideal_min <= value <= ideal_max:
                feedback.append({
                    'category': metric_name.replace('_', ' ').title(),
                    'score': 10,
                    'message': f"Excellent {metric_name.replace('_', ' ')} at {value:.1f}°",
                    'severity': 'good'
                })
            elif acceptable_min <= value <= acceptable_max:
                feedback.append({
                    'category': metric_name.replace('_', ' ').title(),
                    'score': 7,
                    'message': f"Good {metric_name.replace('_', ' ')} at {value:.1f}°, room for improvement",
                    'severity': 'warning'
                })
            else:
                if value < acceptable_min:
                    message = f"{metric_name.replace('_', ' ')} too low at {value:.1f}°"
                else:
                    message = f"{metric_name.replace('_', ' ')} too high at {value:.1f}°"
                
                feedback.append({
                    'category': metric_name.replace('_', ' ').title(),
                    'score': 4,
                    'message': message,
                    'severity': 'error'
                })
        
        return feedback

    def draw_annotated_keyframe(self, frame: np.ndarray, landmarks: Dict[str, Any], 
                              metrics: Dict[str, float], output_path: str) -> str:
        """Draw annotated keyframe with landmarks and angles."""
        annotated_frame = frame.copy()
        height, width = frame.shape[:2]
        
        def get_point(landmark_name: str) -> Tuple[int, int]:
            lm = landmarks[landmark_name]
            return (int(lm['x'] * width), int(lm['y'] * height))
        
        # Draw pose landmarks
        for landmark_name, lm in landmarks.items():
            x, y = int(lm['x'] * width), int(lm['y'] * height)
            cv2.circle(annotated_frame, (x, y), 5, (0, 255, 0), -1)
            cv2.putText(annotated_frame, landmark_name.split('_')[0], (x+5, y-5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 255, 0), 1)
        
        # Draw key angles
        try:
            # Front elbow angle
            left_shoulder = get_point('LEFT_SHOULDER')
            left_elbow = get_point('LEFT_ELBOW')
            left_wrist = get_point('LEFT_WRIST')
            
            # Draw angle arc
            cv2.ellipse(annotated_frame, left_elbow, (20, 20), 0, 0, 
                       int(metrics['front_elbow_angle']), (255, 0, 0), 2)
            cv2.putText(annotated_frame, f"Elbow: {metrics['front_elbow_angle']:.1f}°", 
                       (left_elbow[0]+10, left_elbow[1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
            
        except Exception as e:
            print(f"Error drawing annotations: {e}")
        
        # Save annotated frame
        cv2.imwrite(output_path, annotated_frame)
        return output_path

    def analyze_cover_drive(self, video_path: str, output_dir: str) -> Dict[str, Any]:
        """
        Main analysis function for cover drive shots.
        Returns comprehensive analysis results.
        """
        try:
            # Detect keyframe
            keyframe_idx, keyframe = self.detect_keyframe(video_path)
            
            # Extract landmarks from keyframe
            landmarks = self.extract_landmarks(keyframe)
            if not landmarks:
                raise RuntimeError("Could not detect pose in keyframe")
            
            # Calculate metrics
            metrics = self.calculate_metrics(landmarks, keyframe.shape[:2])
            
            # Generate feedback
            feedback = self.generate_feedback(metrics)
            
            # Create output directory
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Save annotated keyframe
            video_name = Path(video_path).stem
            keyframe_path = output_path / f"{video_name}_keyframe.jpg"
            self.draw_annotated_keyframe(keyframe, landmarks, metrics, str(keyframe_path))
            
            # Prepare results
            results = {
                'shot_type': 'cover_drive',
                'keyframe_index': keyframe_idx,
                'metrics': metrics,
                'feedback': feedback,
                'keyframe_path': str(keyframe_path),
                'analysis_timestamp': str(Path(video_path).stat().st_mtime),
                # "video_path": f"results/{Path(video_path).name}"  told to remove as it is responsibility of analysis.py to contruct this url 1
            }
            
            return results
            
        except Exception as e:
            print(f"Error in cover drive analysis: {e}")
            return {
                'error': str(e),
                'shot_type': 'cover_drive',
                'metrics': {},
                'feedback': [],
                'keyframe_path': None
            }
        finally:
            self.pose.close()


def analyze_cover_drive_video(video_path: str, output_dir: str) -> Dict[str, Any]:
    """
    Convenience function to analyze a cover drive video.
    """
    analyzer = CoverDriveAnalyzer()
    return analyzer.analyze_cover_drive(video_path, output_dir)


if __name__ == "__main__":
    # Example usage
    import sys
    if len(sys.argv) != 3:
        print("Usage: python cover_drive_analyzer.py <video_path> <output_dir>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    result = analyze_cover_drive_video(video_path, output_dir)
    print(json.dumps(result, indent=2))
