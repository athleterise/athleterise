import { useEffect, useRef } from "react";

interface PoseViewerProps {
  data: any;
}

export default function PoseViewer({ data }: PoseViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.frames) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 640; // fixed width for MVP
    canvas.height = 360; // fixed height

    data.frames.forEach((frame: any) => {
      if (!frame.pose) return;
      frame.pose.forEach((lm: any) => {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      });
    });
  }, [data]);

  return <canvas ref={canvasRef} className="border border-gray-300" />;
}
