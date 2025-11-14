"use client";
import { useState } from "react";
import AnalysisResults from "../../components/AnalysisResults";

export default function ResultsPage() {
  const [data, setData] = useState<any>(null);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-2xl border border-gray-100">
      {data ? (
        <AnalysisResults data={data} />
      ) : (
        <p className="text-center text-gray-600">No results available.</p>
      )}
    </div>
  );
}
