export const validateBase64Image = (data, maxBytes = 5 * 1024 * 1024) => {
  if (!data || typeof data !== "string") {
    return { valid: false, error: "Invalid image data" };
  }

  const match = data.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
  if (!match) {
    return { valid: false, error: "Unsupported image format" };
  }

  const base64 = data.split(",")[1] || "";
  const bytes = Math.ceil((base64.length * 3) / 4);

  if (bytes > maxBytes) {
    return { valid: false, error: "Image too large" };
  }

  return { valid: true };
};
