import React, { useEffect, useRef } from "react";

interface SkeletonProps {
  data: any; // expected shape: { frames: [ { pose: [ {x,y,score?} ] } ] }
  width?: number;
  height?: number;
  animate?: boolean; // animate frames like a replay
  fps?: number;
  connections?: number[][];
}

const DEFAULT_CONNECTIONS = [
  [11, 13], [13, 15], [12, 14], [14, 16], [11, 12],
  [23, 24], [11, 23], [12, 24], [23, 25], [25, 27],
  [24, 26], [26, 28], [5, 7], [6, 8]
];

export default function Skeleton({
  data,
  width = 640,
  height = 360,
  animate = false,
  fps = 12,
  connections = DEFAULT_CONNECTIONS,
}: SkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // If there's no data, clear and exit
    if (!data) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
      }
      return;
    }

    // DPR handling (crisp drawing on HiDPI displays)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    // frames extraction
    const frames = Array.isArray(data.frames) ? data.frames : [];
    if (frames.length === 0) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#333";
      ctx.font = "14px sans-serif";
      ctx.fillText("No frames in data", 10, 20);
      return;
    }

    // detect whether coords are normalized (0..1) or pixel coords (>1)
    const samplePose = frames[0].pose || frames[0].keypoints || frames[0];
    let normalized = true;
    if (Array.isArray(samplePose) && samplePose.length > 0) {
      for (let i = 0; i < Math.min(5, samplePose.length); i++) {
        const p = samplePose[i];
        const x = p?.x ?? p?.[0];
        const y = p?.y ?? p?.[1];
        if (x == null || y == null) continue;
        if (x > 1 || y > 1) {
          normalized = false;
          break;
        }
      }
    }

    let frameIndex = 0;
    let intervalId: number | null = null;

    function drawFrame(fi: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);

      const frame = frames[fi];
      const pose = frame?.pose || frame?.keypoints || [];
      // Draw bones / connections first
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(30,144,255,0.9)"; // blue-ish
      connections.forEach(([a, b]) => {
        const pa = pose[a];
        const pb = pose[b];
        if (!pa || !pb) return;
        const ax = normalized ? (pa.x ?? pa[0]) * width : (pa.x ?? pa[0]);
        const ay = normalized ? (pa.y ?? pa[1]) * height : (pa.y ?? pa[1]);
        const bx = normalized ? (pb.x ?? pb[0]) * width : (pb.x ?? pb[0]);
        const by = normalized ? (pb.y ?? pb[1]) * height : (pb.y ?? pb[1]);
        if ([ax, ay, bx, by].every(Number.isFinite)) {
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      });

      // Draw keypoints
      pose.forEach((p: any, idx: number) => {
        const rawX = p?.x ?? p?.[0];
        const rawY = p?.y ?? p?.[1];
        if (rawX == null || rawY == null) return;
        const x = normalized ? rawX * width : rawX;
        const y = normalized ? rawY * height : rawY;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4d4f"; // red-ish
        ctx.fill();

        // small index label (optional)
        ctx.fillStyle = "#111";
        ctx.font = "10px sans-serif";
        ctx.fillText(String(idx), x + 6, y - 6);
      });

      // overlay
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.font = "12px sans-serif";
      ctx.fillText(`frame ${fi + 1}/${frames.length}`, 8, 14);
    }

    // draw first frame immediately
    drawFrame(frameIndex);

    if (animate) {
      const ms = Math.max(20, Math.round(1000 / fps));
      intervalId = window.setInterval(() => {
        frameIndex = (frameIndex + 1) % frames.length;
        drawFrame(frameIndex);
      }, ms) as unknown as number;
    }

    return () => {
      if (intervalId) clearInterval(intervalId as number);
    };
  }, [data, width, height, animate, fps, JSON.stringify(DEFAULT_CONNECTIONS)]); // keep dependencies stable

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <canvas
        ref={canvasRef}
        // width/height attributes are mostly overwritten in effect for DPR, but set defaults
        width={width}
        height={height}
        style={{ display: "block", border: "1px solid #e5e7eb", background: "#fff" }}
      />
    </div>
  );
}
