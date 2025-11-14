export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const testConnection = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    const data = await res.json();
    console.log("Backend connection test:", data);
    return data;
  } catch (error) {
    console.error("Backend connection failed:", error);
    throw error;
  }
};


export const uploadVideo = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Upload failed:", errorText);
      throw new Error(`Upload failed: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log("Upload successful:", data);
    return data;
  } catch (error) {
    console.error("Network error during upload:", error);
    throw error;
  }
};

export const getResult = async (jobId: string) => {
  const res = await fetch(`${BACKEND_URL}/result/${jobId}`);
  if (res.status === 200) return res.json();
  return null;
};

export const analyzeVideo = async (jobId: string, shotType: string) => {
  const res = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      job_id: jobId,
      shot: shotType,
    }),
  });

  if (!res.ok) {
    throw new Error(`Analysis failed: ${res.statusText}`);
  }

  return res.json();
};
