import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getResult } from "../../../utils/api";
import PoseViewer from "../../../components/PoseViewer";

export default function ResultPage() {
  const router = useRouter();
  const { jobId } = router.query as { jobId: string };
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
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  if (loading) return <p className="p-4">Processing video... please wait.</p>;
  if (!data) return <p className="p-4">No data found</p>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">Pose Landmarks</h2>
      <PoseViewer data={data} />
    </div>
  );
}
