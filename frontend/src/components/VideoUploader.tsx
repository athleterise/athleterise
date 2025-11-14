import { useState } from "react";

// VideoUploader Component
interface VideoUploaderProps {
  onResult: (data: any) => void;
}

export default function VideoUploader({ onResult }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shotType, setShotType] = useState<string>("cover_drive");
  const [connectionStatus, setConnectionStatus] = useState<string>("✅ Backend connected");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setJobId(null);
      setStatus("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("Uploading...");
    // Simulate upload - replace with actual API call
    setTimeout(() => {
      setJobId("job_" + Math.random().toString(36).substr(2, 9));
      setStatus("Uploaded successfully");
    }, 1500);
  };

  const handleAnalyze = async () => {
    if (!file || !jobId) return;
    setIsAnalyzing(true);
    setStatus("Analyzing...");
    
    // Simulate analysis - replace with actual API call
    setTimeout(() => {
      const mockResult = {
        metrics: {
          front_elbow_angle: 165,
          back_elbow_angle: 85,
          torso_lean: 18,
          shoulder_alignment: 22,
          front_knee_angle: 95,
          back_knee_angle: 135,
          hip_rotation: 42,
          wrist_angle: 160,
          head_position: 12,
          center_of_mass: 8.5
        },
        feedback: [
          { category: "Elbow Position", score: 8.5, message: "Excellent front arm extension with proper lock at impact. Maintain this form for consistent power transfer.", severity: "good" },
          { category: "Balance & Weight Transfer", score: 7.2, message: "Good weight transfer but slight imbalance detected. Focus on keeping center of mass over front foot during impact.", severity: "warning" },
          { category: "Footwork Technique", score: 9.1, message: "Outstanding foot placement and stride length. Perfect positioning for the cover drive shot.", severity: "good" },
          { category: "Head Position", score: 6.8, message: "Head falling away slightly at impact. Keep eyes level and watch the ball closely through the shot.", severity: "warning" },
          { category: "Hip Rotation", score: 8.8, message: "Excellent hip rotation generating good power. Timing of rotation is optimal for this shot type.", severity: "good" },
          { category: "Follow Through", score: 7.5, message: "Good follow through but could extend further. Complete the swing for maximum power and control.", severity: "warning" }
        ],
        keyframe_path: "keyframe_annotated.jpg",
        shot_type: shotType,
        frames: Array(30).fill(null).map(() => ({
          pose: Array(33).fill(null).map(() => ({
            x: Math.random(),
            y: Math.random(),
            score: 0.9
          }))
        }))
      };
      setStatus("Analysis complete");
      onResult(mockResult);
      setIsAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="relative group">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          id="video-upload-input"
        />
        <label
          htmlFor="video-upload-input"
          className="block w-full p-10 border-2 border-dashed border-blue-500 rounded-2xl cursor-pointer hover:border-blue-600 transition-all duration-300 bg-white shadow-lg"
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-800 mb-2">
              {file ? file.name : "Drop your cricket video here"}
            </p>
            <p className="text-sm text-gray-600">or click to browse • MP4, MOV, AVI</p>
          </div>
        </label>
      </div>

      {/* Video Preview */}
      {file && (
        <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-md">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Video Preview
          </label>
          <video
            src={URL.createObjectURL(file)}
            controls
            className="w-full rounded-xl shadow-md border border-gray-300"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {/* Shot Type Selection */}
      <div className="bg-white border border-gray-300 rounded-2xl p-5 shadow-md">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Shot Type Selection
        </label>
        <select
          value={shotType}
          onChange={(e) => setShotType(e.target.value)}
          className="block w-full px-4 py-3.5 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800"
        >
          <option value="cover_drive">🏏 Cover Drive</option>
          <option value="straight_drive">⬆️ Straight Drive</option>
          <option value="pull_shot">💪 Pull Shot</option>
          <option value="cut_shot">✂️ Cut Shot</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleUpload}
          disabled={!file}
          className="px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload
        </button>
        <button
          onClick={handleAnalyze}
          disabled={!jobId || isAnalyzing}
          className="px-6 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyze
            </>
          )}
        </button>
      </div>

  
      {/* {connectionStatus && (
        <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-4">
          <p className="text-sm text-emerald-700 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            <span className="font-semibold mr-2">Backend:</span> {connectionStatus}
          </p>
        </div>
      )} */}

      
      {/* {status && (
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-700 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold mr-2">Status:</span> {status}
          </p>
          {jobId && (
            <p className="text-xs text-gray-500 mt-2 ml-6 font-mono">
              Job ID: {jobId}
            </p>
          )}
        </div>
      )} */}

      {/* Progress Indicator */}
      {isAnalyzing && (
        <div className="bg-blue-100 border border-blue-300 rounded-xl p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-sm text-blue-700 font-medium">Processing biomechanical analysis...</span>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-progress"></div>
          </div>
        </div>
      )}
    </div>
  );
}