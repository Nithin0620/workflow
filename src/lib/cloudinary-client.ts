export interface CloudinaryUploadResult {
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Uploads a file directly to Cloudinary via unsigned upload preset.
 * If Cloudinary fails or is unconfigured, falls back to a reliable base64 data URI
 * so user attachments always work seamlessly without crashing the UI.
 */
import { uploadServerFileToCloudinary } from "@/actions/attachments";

export async function uploadFileToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadServerFileToCloudinary(formData);
    if (res.success && res.result) {
      return res.result;
    }
    console.warn("Signed upload returned error, trying fallback:", res.error);
  } catch (err) {
    console.warn("Server-side signed upload failed, using fallback:", err);
  }

  // Fallback: convert file to Base64 data URL if server upload fails
  const base64Url = await fileToBase64(file);
  return {
    publicId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    fileUrl: base64Url,
  };
}