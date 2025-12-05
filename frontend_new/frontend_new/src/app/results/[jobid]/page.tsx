"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getResult } from "../../../utils/api";
import PoseViewer from "../../../components/PoseViewer";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const result = await getResult(jobId);
        if (result) {
          setData(result);
          setLoading(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error fetching result:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div>
      {loading ? <p>Loading...</p> : <PoseViewer data={data} />}
    </div>
  );
}