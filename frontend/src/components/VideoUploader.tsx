import { useState, useRef, useEffect } from "react";
import { uploadVideo, analyzeVideo, testConnection } from "../utils/api";

interface VideoUploaderProps {
  onResult: (data: any) => void;
}

export default function VideoUploader({ onResult }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shotType, setShotType] = useState<string>("cover_drive");
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

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
      setStatus("Analysis complete");
      onResult(analysisResult);
    } catch (err) {
      console.error(err);
      setStatus("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Video Analysis</h2>
      
      {/* File Upload */}
      <div className="mb-4">
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Preview
          </label>
          <video
            ref={videoRef}
            src={URL.createObjectURL(file)}
            controls
            className="w-full max-w-md mx-auto rounded-lg"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {/* Shot Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shot Type
        </label>
        <select
          value={shotType}
          onChange={(e) => setShotType(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="cover_drive">Cover Drive</option>
          <option value="straight_drive">Straight Drive</option>
          <option value="pull_shot">Pull Shot</option>
          <option value="cut_shot">Cut Shot</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleUpload}
          disabled={!file}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Upload Video
        </button>
        
        <button
          onClick={handleAnalyze}
          disabled={!jobId || isAnalyzing}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Cover Drive"}
        </button>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Backend:</span> {connectionStatus}
          </p>
        </div>
      )}

      {/* Status Display */}
      {status && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
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
        <div className="mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Processing video analysis...</span>
          </div>
        </div>
      )}
    </div>
  );
}
