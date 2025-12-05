"use client";
import { useState } from "react";
import VideoUploader from "../components/VideoUploader";
import AnalysisResults from "../components/AnalysisResults";
import Skeleton from "../components/Skeleton";

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800">
          Cricket Shot Analysis
        </h1>

        <div className="mb-8">
          <VideoUploader 
          onResult={(data) => setResult(data)}
          onJobIdChange={(id) => setJobId(id)}
          onUploadedFileNameChange={(name) => setUploadedFileName(name)}
           />
        </div>

        {/* Display biomechanical analysis results */}
        {result && result.metrics && (
          <div className="mb-8">
            <AnalysisResults
             data={result} 
             jobId={jobId||""}
            fileName={uploadedFileName||""}
            shotType={result.shot_type}
             />
          </div>
        )}

        {/* Display pose skeleton */}
        {result && result.frames && (
          <div className="mt-8">
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`px-6 py-3 text-white font-semibold rounded-md transition ${
                  showSkeleton
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {showSkeleton ? "Hide" : "Show"} Pose Skeleton
              </button>
            </div>
            {showSkeleton && (
              <div className="flex justify-center">
                <Skeleton data={result} animate={true} fps={15} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
