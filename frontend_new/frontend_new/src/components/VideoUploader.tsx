import { useState, useRef, useEffect } from "react";
import { uploadVideo, analyzeVideo, testConnection } from "../utils/api";

interface VideoUploaderProps {
  onResult: (data: any) => void;
  onJobIdChange: (jobId: string | null) => void;
  onUploadedFileNameChange: (name: string | null) => void;
}

export default function VideoUploader({
  onResult,
  onJobIdChange,
  onUploadedFileNameChange,
}: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shotType, setShotType] = useState<string>("cover_drive");
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // ---------------------------------------
  // Helper function: Poll for MP4 readiness
  // ---------------------------------------
  async function waitForFile(
    url: string,
    maxRetries = 20,
    delayMs = 3000
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          console.log("MP4 is ready on server:", url);
          return true;
        }
      } catch (err) {
        console.warn("Polling error:", err);
      }

      console.log(`MP4 not ready yet. Retry ${i + 1}/${maxRetries}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    console.error("MP4 never became available:", url);
    return false;
  }

  // Test backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        await testConnection();
        setConnectionStatus("✅ Backend connected");
      } catch (error) {
        setConnectionStatus("❌ Backend connection failed");
        console.error("Backend connection test failed:", error);
      }
    };

    testBackendConnection();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setJobId(null);
      onJobIdChange(null);
      onUploadedFileNameChange(selectedFile.name);
      setStatus("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("Uploading...");
    console.log("Starting upload for file:", file.name);

    try {
      const data = await uploadVideo(file);
      console.log("Upload response:", data);
      setJobId(data.job_id);
      onJobIdChange(data.job_id);
      setStatus(data.status);
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("Upload failed");
    }
  };

  const handleAnalyze = async () => {
    if (!file || !jobId) return;
    setIsAnalyzing(true);
    setStatus("Analyzing...");

    try {
      const analysisResult = await analyzeVideo(jobId, shotType);

      console.log("ANALYSIS RESULT RECEIVED:", analysisResult);

      setStatus("Analysis complete");
      onResult(analysisResult);

      // -------------------------------
      // MP4 POLLING + DOWNLOAD LOGIC
      // -------------------------------
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      if (analysisResult.overlay_video_url) {
        const videoUrl = `${backendUrl}${analysisResult.overlay_video_url}`;
        const filename =
          analysisResult.overlay_video_url.split("/").pop() ||
          "annotated_video.mp4";

        console.log("Polling for MP4:", videoUrl);

        const ready = await waitForFile(videoUrl, 20, 3000); // ~60 sec max

        if (ready) {
          console.log("MP4 FOUND — triggering download.");
          triggerAutoDownload(videoUrl, filename);
        } else {
          console.warn("MP4 never became available after polling.");
        }
      } else {
        console.warn("Backend did not return overlay_video_url.");
      }
      // -------------------------------

    } catch (err) {
      console.error("Analysis failed with error:", err);
      setStatus("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerAutoDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Upload and Analyze Your Video
      </h2>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Video
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Video Preview */}
      {file && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Preview
          </label>
          <video
            ref={videoRef}
            src={URL.createObjectURL(file)}
            controls
            className="w-full rounded-lg shadow-md"
            style={{ maxHeight: "300px" }}
          />
        </div>
      )}

      {/* Shot Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Shot Type
        </label>
        <select
          value={shotType}
          onChange={(e) => setShotType(e.target.value)}
          className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="cover_drive">Cover Drive</option>
          <option value="straight_drive">Straight Drive</option>
          <option value="pull_shot">Pull Shot</option>
          <option value="cut_shot">Cut Shot</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleUpload}
          disabled={!file}
          className="flex-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Upload Video
        </button>
        <button
          onClick={handleAnalyze}
          disabled={!jobId || isAnalyzing}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isAnalyzing
            ? `Analyzing ${shotType.replace("_", " ")}...`
            : `Analyze ${shotType.replace("_", " ")}`}
        </button>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg shadow-md">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Backend:</span> {connectionStatus}
          </p>
        </div>
      )}

      {/* Status Display */}
      {status && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-md">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Status:</span> {status}
          </p>
          {jobId && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Job ID:</span> {jobId}
            </p>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {isAnalyzing && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">
            Processing video analysis...
          </span>
        </div>
      )}
    </div>
  );
}
