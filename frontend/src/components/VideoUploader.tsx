import { useState } from "react";
import { uploadVideo } from "../utils/api";

export default function VideoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const handleUpload = async () => {
    if (!file) return;
    setStatus("Uploading...");
    try {
      const data = await uploadVideo(file);
      setJobId(data.job_id);
      setStatus(data.status);
    } catch (err) {
      console.error(err);
      setStatus("Upload failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Upload Video
      </button>

      {jobId && (
        <div className="mt-4">
          <p>Job ID: {jobId}</p>
          <p>Status: {status}</p>
          <a href={`/result/${jobId}`} className="text-blue-500 underline">
            View Result
          </a>
        </div>
      )}
    </div>
  );
}
