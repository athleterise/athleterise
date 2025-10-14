const BACKEND_URL = "http://127.0.0.1:8000";

export const uploadVideo = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return res.json();
};

export const getResult = async (jobId: string) => {
  const res = await fetch(`${BACKEND_URL}/result/${jobId}`);
  if (res.status === 200) return res.json();
  return null;
};
