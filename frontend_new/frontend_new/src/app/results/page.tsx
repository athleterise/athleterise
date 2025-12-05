"use client";
import { useState } from "react";
import VideoUploader from "../../components/VideoUploader";
import AnalysisResults from "../../components/AnalysisResults";
import Skeleton from "../../components/Skeleton";
import '../global.css';

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-3xl p-8">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800">
          Cricket Shot Analysis
        </h1>

        {/* Video Upload and Analysis */}
        <div className="mb-8">
          <VideoUploader onResult={(data) => setResult(data)} />
        </div>

        {/* Analysis Results */}
        {result && result.metrics && (
          <div className="mb-8">
            <AnalysisResults data={result} />
          </div>
        )}

        {/* Legacy Skeleton Display (Optional) */}
        {result && result.frames && (
          <div className="mt-8">
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className="px-6 py-3 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition"
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
