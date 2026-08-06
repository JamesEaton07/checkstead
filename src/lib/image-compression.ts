// Client-only (Canvas/createImageBitmap): downscales and re-encodes a
// photo before upload so tenants on slow mobile connections aren't
// pushing full 10-20MB phone camera originals. `imageOrientation:
// "from-image"` makes createImageBitmap apply the photo's EXIF rotation
// itself, so the output is never sideways even though the canvas we draw
// into has no EXIF handling of its own.
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export class ImageCompressionError extends Error {}

export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new ImageCompressionError("File is not an image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageCompressionError("Image is too large (max 25MB).");
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new ImageCompressionError("Canvas is not supported in this browser.");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );

  if (!blob) {
    throw new ImageCompressionError("Failed to encode compressed image.");
  }

  return blob;
}
