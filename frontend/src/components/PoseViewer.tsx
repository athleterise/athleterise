// import { useEffect, useRef } from "react";

// interface PoseViewerProps {
//   data: any;
// }

// export default function PoseViewer({ data }: PoseViewerProps) {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas || !data.frames) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     canvas.width = 640; // fixed width for MVP
//     canvas.height = 360; // fixed height

//     data.frames.forEach((frame: any) => {
//       if (!frame.pose) return;
//       frame.pose.forEach((lm: any) => {
//         ctx.beginPath();
//         ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 3, 0, 2 * Math.PI);
//         ctx.fillStyle = "red";
//         ctx.fill();
//       });
//     });
//   }, [data]);

//   return <canvas ref={canvasRef} className="border border-gray-300" />;
// }
import { useEffect, useRef, useState } from "react";

interface PoseViewerProps {
  data: any;
  width?: number;
  height?: number;
}

export default function PoseViewer({
  data,
  width = 640,
  height = 360,
}: PoseViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [debugText, setDebugText] = useState<string>("No data yet");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!data) {
      setDebugText("No data prop");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // Basic sanity checks & logging
    console.log("PoseViewer received data:", data);
    if (!Array.isArray(data.frames) || data.frames.length === 0) {
      setDebugText("No frames found in data.frames");
      return;
    }

    // DPR scaling for crispness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setDebugText("2D context unavailable");
      return;
    }
    // scale context once for DPR
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    // Draw background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Examine first frame to detect coordinate type
    const firstFrame = data.frames[0];
    const poseArr = firstFrame?.pose || firstFrame?.keypoints || null;
    if (!Array.isArray(poseArr) || poseArr.length === 0) {
      setDebugText("No pose array in first frame (expected frame.pose or frame.keypoints).");
      return;
    }

    // Detect whether coords are normalized (0..1) or pixels (>1)
    let normalized = true;
    for (let i = 0; i < Math.min(5, poseArr.length); i++) {
      const p = poseArr[i];
      if (!p) continue;
      const x = p.x ?? p[0];
      const y = p.y ?? p[1];
      if (x == null || y == null) continue;
      if (x > 1 || y > 1) {
        normalized = false;
        break;
      }
    }

    setDebugText(
      `frames: ${data.frames.length} | sample points: ${poseArr.length} | coords: ${
        normalized ? "normalized (0..1)" : "pixels"
      }`
    );

    // Choose whether to animate all frames or just draw the first frame
    const animate = false; // set true to animate through frames
    let rafId: number | null = null;
    let intervalId: number | null = null;
    let frameIndex = 0;

    function drawFrame(frameIndexToDraw: number) {
      if (!ctx) return;
      // clear (only the draw area)
      ctx.clearRect(0, 0, width, height);
      // background
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);

      const frame = data.frames[frameIndexToDraw];
      if (!frame) return;
      const arr = frame.pose || frame.keypoints || [];
      // draw each landmark
      arr.forEach((lm: any) => {
        const rawX = lm.x ?? lm[0];
        const rawY = lm.y ?? lm[1];
        if (rawX == null || rawY == null) return;
        const x = normalized ? rawX * width : rawX;
        const y = normalized ? rawY * height : rawY;

        // small circle
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();

        // optional: show index
        // ctx.fillStyle = "black";
        // ctx.fillText(String(idx), x + 4, y - 4);
      });

      // overlay text for debugging
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.font = "12px sans-serif";
      ctx.fillText(`frame ${frameIndexToDraw + 1}/${data.frames.length}`, 8, 14);
    }

    if (animate) {
      // simple setInterval animation (one frame per 100ms)
      intervalId = window.setInterval(() => {
        drawFrame(frameIndex);
        frameIndex = (frameIndex + 1) % data.frames.length;
      }, 100);
    } else {
      // draw only the first frame (fast and stable for debugging)
      drawFrame(0);
    }

    // cleanup
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [data, width, height]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        className="border border-gray-300"
        // NOTE: width/height attributes are set in effect for DPR; provide fallback
        width={640}
        height={360}
        style={{ background: "#fff", display: "block" }}
      />
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          background: "rgba(255,255,255,0.85)",
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        {debugText}
      </div>
    </div>
  );
}

