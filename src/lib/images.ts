// Must stay in sync with ALLOWED_CONTENT_TYPES in the backend's app/services/s3.py,
// so an unsupported file is rejected here instead of by the presign call.
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_IMAGE_HINT = "JPG, PNG, WEBP, GIF, AVIF up to 10MB";

/** Returns an error message if the file can't be uploaded, or null if it's fine. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Use a JPG, PNG, WEBP, GIF, or AVIF image";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be smaller than 10MB";
  }
  return null;
}
