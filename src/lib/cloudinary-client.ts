export interface CloudinaryUploadResult {
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

/**
 * Uploads a file directly to Cloudinary via an unsigned upload preset.
 * Uses resource_type "auto" so images, videos, and raw files all work.
 */
export async function uploadFileToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload to Cloudinary failed.");
  }

  const data = await res.json();

  return {
    publicId: data.public_id,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: data.bytes,
    fileUrl: data.secure_url,
  };
}