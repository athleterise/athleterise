"use client";
import { useState } from "react";
import VideoUploader from "../components/VideoUploader";
import AnalysisResults from "../components/AnalysisResults";
import Skeleton from "../components/Skeleton"; 

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
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
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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
