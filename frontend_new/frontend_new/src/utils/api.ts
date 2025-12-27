export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://athleterise-backend.onrender.com";

export const testConnection = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    return await res.json();
  } catch (error) {
    console.error("Backend connection failed:", error);
    throw error;
  }
};

// =====================================================
// UPDATED: uploadVideo now sends shot_type as well
// =====================================================
export const uploadVideo = async (file: File, shotType: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("shot_type", shotType); // 🔹 NEW

  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed ${text}`);
  }

  return res.json();
};

export const getResult = async (jobId: string) => {
  try {
    const res = await fetch(`${BACKEND_URL}/result/${jobId}`);
    if (!res.ok) {
      console.error(`Error fetching result: ${res.status} - ${res.statusText}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error in getResult:", error);
    return null;
  }
};

export const analyzeVideo = async (jobId: string, shotType: string) => {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const url = `${base}/analyze/`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, shot: shotType }),
  });

  if (!res.ok) {
    console.error("Analyze video error:", await res.text());
    throw new Error(`Backend error: ${res.status}`);
  }

  const result = await res.json();
  console.log("Analysis result:", result);
  return result;
};
