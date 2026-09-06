import { createHash } from "crypto";

/**
 * Best-effort deletion of a Cloudinary asset using the Admin API's destroy endpoint.
 * No SDK dependency: signs the request with SHA1( sortedParams + api_secret ).
 * Skips silently if credentials are not configured.
 */
export async function destroyCloudinaryAsset(
  publicId: string,
  fileType?: string
): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return;

  const resourceType = fileType?.startsWith("image/") ? "image" : "raw";
  const params: Record<string, string> = {
    public_id: publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
    resource_type: resourceType,
  };

  const signature = createHash("sha1")
    .update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + apiSecret)
    .digest("hex");

  const body = new URLSearchParams({ ...params, api_key: apiKey, signature });

  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body,
    });
  } catch {
    // Orphan cleanup is best-effort; the DB row delete is the source of truth.
  }
}