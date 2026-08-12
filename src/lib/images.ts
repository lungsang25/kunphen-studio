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

/** A shape requirement for images that go into a fixed slot on the public site. */
export interface ImageSpec {
  /** width / height */
  ratio: number;
  /** Allowed relative deviation from `ratio`, e.g. 0.02 for ±2%. */
  tolerance: number;
  /** Below this the image is still accepted, but the editor is warned. */
  minWidth: number;
  /** Human-readable requirement, shown in the uploader and in error messages. */
  label: string;
}

/** The homepage hero renders full-bleed with object-cover; every slide shipped so
 *  far is 1920×1080, so anything that isn't 16:9 would be silently cropped. */
export const HERO_IMAGE_SPEC: ImageSpec = {
  ratio: 16 / 9,
  tolerance: 0.02,
  minWidth: 1600,
  label: "16:9 (e.g. 1920×1080)",
};

export interface ImageSize {
  width: number;
  height: number;
}

/** Reads a file's pixel dimensions without uploading it. */
export function readImageSize(file: File): Promise<ImageSize> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image"));
    };

    img.src = url;
  });
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** "1920×1080 (16:9)" — the reduced ratio is dropped when it isn't a tidy one. */
export function describeSize({ width, height }: ImageSize): string {
  const divisor = gcd(width, height) || 1;
  const w = width / divisor;
  const h = height / divisor;
  return w <= 40 && h <= 40 ? `${width}×${height} (${w}:${h})` : `${width}×${height}`;
}

export interface ImageProblem {
  /** Blocks the upload. */
  error?: string;
  /** Allows the upload, but tells the editor the image is weaker than it should be. */
  warning?: string;
}

export function validateImageDimensions(
  size: ImageSize,
  spec: ImageSpec
): ImageProblem {
  const ratio = size.width / size.height;
  if (Math.abs(ratio - spec.ratio) > spec.ratio * spec.tolerance) {
    return {
      error: `Image must be ${spec.label}. This one is ${describeSize(size)}.`,
    };
  }
  if (size.width < spec.minWidth) {
    return {
      warning: `${size.width}px wide — ${spec.minWidth}px or more is recommended so the image stays sharp full-screen.`,
    };
  }
  return {};
}

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

/**
 * File-type and size checks, plus the dimension checks when a `spec` is given.
 * Callers without a spec get exactly the behaviour of `validateImageFile`.
 */
export async function validateImage(
  file: File,
  spec?: ImageSpec
): Promise<ImageProblem> {
  const fileProblem = validateImageFile(file);
  if (fileProblem) return { error: fileProblem };
  if (!spec) return {};

  try {
    return validateImageDimensions(await readImageSize(file), spec);
  } catch {
    return { error: "Could not read this image — try a different file" };
  }
}
