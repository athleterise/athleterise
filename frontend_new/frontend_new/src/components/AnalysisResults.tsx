import { BACKEND_URL } from "../utils/api";
import { useState, useEffect } from "react";

interface AnalysisResultsProps {
  fileName: string;
  shotType: string;
  jobId: string;
  data: {
    metrics: {
      front_elbow_angle: number;
      back_elbow_angle: number;
      torso_lean: number;
      shoulder_alignment: number;
      front_knee_angle: number;
      back_knee_angle: number;
      hip_rotation: number;
      wrist_angle: number;
      head_position: number;
      center_of_mass: number;
    };
    feedback: Array<{
      category: string;
      score: number;
      message: string;
      severity: "good" | "warning" | "error";
    }>;
    keyframe_url?: string;
    overlay_video_url?: string;
    shot_type: string;
  };
}

export default function AnalysisResults({
  data,
  jobId,
  fileName,
  shotType,
}: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<
    "metrics" | "feedback" | "keyframe"
  >("metrics");

  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const keyframeUrl = `${BACKEND_URL}/static/${jobId}_${baseName}_keyframe.jpg`;

  // 🔥 ALWAYS USE MP4 — ignore backend URLs completely
  const annotatedVideoUrl = `${BACKEND_URL}/static/${jobId}_overlay.mp4`;

  const safeToFixed = (value: number | undefined, decimals: number = 2) => {
    if (typeof value !== "number") {
      console.warn("Invalid metric value:", value); // Debugging log
      return "N/A";
    }
    return value.toFixed(decimals);
  };

  // Debugging: Log the entire data object to verify its structure
  useEffect(() => {
    console.log("Analysis data:", data);
  }, [data]);

  // Debugging: Log the metrics data to verify its structure
  useEffect(() => {
    console.log("Metrics data:", data.metrics);
  }, [data.metrics]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "good":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const [keyframeAvailable, setKeyframeAvailable] = useState(false);

  useEffect(() => {
    const checkKeyframeAvailability = async () => {
      if (!data.keyframe_url) {
        console.warn("Keyframe URL is missing"); // Debugging log
        return;
      }

      const maxRetries = 5;
      let retries = 0;

      while (retries < maxRetries) {
        try {
          const response = await fetch(keyframeUrl, { method: "HEAD" });
          if (response.ok) {
            setKeyframeAvailable(true);
            break;
          }
        } catch (error) {
          console.error("Error checking keyframe availability:", error);
        }
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
    };

    checkKeyframeAvailability();
  }, [data.keyframe_url]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Analysis Results</h2>
        <p className="text-gray-600">Detailed insights into your cricket shot</p>
      </div>

      {/* ------------------------------- */}
      {/*  ✔ DOWNLOAD MP4 BUTTON ALWAYS   */}
      {/* ------------------------------- */}
      <div className="text-center mb-8">
        <a
          href={annotatedVideoUrl}
          download={`${jobId}_overlay.mp4`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
        >
          Download Annotated Video (MP4)
        </a>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center bg-gray-100 rounded-full p-1 mb-8">
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-6 py-2 font-semibold text-sm rounded-full transition ${
            activeTab === "metrics"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          Metrics
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-6 py-2 font-semibold text-sm rounded-full transition ${
            activeTab === "feedback"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          Feedback
        </button>
        <button
          onClick={() => setActiveTab("keyframe")}
          className={`px-6 py-2 font-semibold text-sm rounded-full transition ${
            activeTab === "keyframe"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          Keyframe
        </button>
      </div>

      {/* -------------------- METRICS TAB -------------------- */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
          {data.metrics ? (
            <>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Biomechanical Metrics
                </h3>
                <p className="text-gray-600">
                  Detailed angle measurements and body positioning analysis
                </p>
              </div>

              {/* Arm Mechanics */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">💪</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">
                    Arm Mechanics
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Front Elbow Angle
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {safeToFixed(data.metrics.front_elbow_angle)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Ideal: 150-170°</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.metrics.front_elbow_angle / 180) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Back Elbow Angle
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {safeToFixed(data.metrics.back_elbow_angle)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Ideal: 70-100°</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.metrics.back_elbow_angle / 120) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Torso & Shoulder */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl shadow-lg border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">🏃</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">
                    Torso & Shoulder
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Torso Lean
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {safeToFixed(data.metrics.torso_lean)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Ideal: 10-25° forward
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.metrics.torso_lean / 30) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Shoulder Alignment
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {safeToFixed(data.metrics.shoulder_alignment)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Ideal: 15-30°</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.metrics.shoulder_alignment / 40) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Body */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border border-purple-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">🦵</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">
                    Lower Body
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Front Knee Angle
                      </span>
                      <span className="text-2xl font-bold text-purple-600">
                        {safeToFixed(data.metrics.front_knee_angle)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Ideal: 80-100°</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.metrics.front_knee_angle / 120) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Back Knee Angle
                      </span>
                      <span className="text-2xl font-bold text-purple-600">
                        {safeToFixed(data.metrics.back_knee_angle)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Ideal: 120-150°</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.metrics.back_knee_angle / 180) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl shadow-lg border border-orange-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">⚡</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">
                    Additional Metrics
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Hip Rotation
                      </span>
                      <span className="text-2xl font-bold text-orange-600">
                        {safeToFixed(data.metrics.hip_rotation)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Ideal: 30-50°</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.metrics.hip_rotation / 60) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Wrist Angle
                      </span>
                      <span className="text-2xl font-bold text-orange-600">
                        {safeToFixed(data.metrics.wrist_angle)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Ideal: 150-170°</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.metrics.wrist_angle / 180) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">No metrics available</p>
          )}
        </div>
      )}

      {/* -------------------- FEEDBACK TAB -------------------- */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          {data.feedback && data.feedback.length > 0 ? (
            <>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Performance Feedback
                </h3>
                <p className="text-gray-600">
                  Detailed analysis and improvement suggestions for your cricket
                  shot
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.feedback.map((item, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${getSeverityColor(
                      item.severity
                    )}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            item.severity === "good"
                              ? "bg-green-500"
                              : item.severity === "warning"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        />
                        <h4 className="text-lg font-bold text-gray-800">
                          {item.category}
                        </h4>
                      </div>
                      {item.score && (
                        <div className="text-right">
                          <span
                            className={`text-2xl font-bold ${getScoreColor(
                              item.score
                            )}`}
                          >
                            {item.score}/10
                          </span>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed">{item.message}</p>

                    {item.score && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.score >= 8
                                ? "bg-green-500"
                                : item.score >= 6
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${item.score * 10}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">No feedback available</p>
          )}
        </div>
      )}

      {/* -------------------- KEYFRAME TAB -------------------- */}
      {activeTab === "keyframe" && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Keyframe Analysis
            </h3>
            <p className="text-gray-600">
              Pose landmarks and angle measurements at the optimal impact moment
            </p>
          </div>

          {keyframeAvailable ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Annotated Keyframe
                </h4>
                <p className="text-sm text-gray-600">
                  Frame showing pose landmarks and calculated angles
                </p>
              </div>

              <div className="relative">
                <img
                  src={keyframeUrl}
                  alt="Annotated keyframe with pose landmarks and angles"
                  className="max-w-full h-auto rounded-lg shadow-xl mx-auto border-4 border-white"
                  style={{ maxHeight: "600px" }}
                />

                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
                  <div className="text-sm font-semibold">Impact Frame</div>
                  <div className="text-xs opacity-90">Pose Analysis</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Pose Landmarks
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    33 body keypoints detected
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Angle Measurements
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Biomechanical analysis
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Optimal Frame
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Peak impact moment
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Keyframe not available</p>
          )}
        </div>
      )}
    </div>
  );
}
