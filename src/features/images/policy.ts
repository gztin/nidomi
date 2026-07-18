export const IMAGE_MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const PROPERTY_IMAGE_LIMIT = 10;
export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;
export const IDENTITY_IMAGE_MIN_LONG_EDGE = 960;
export const IDENTITY_IMAGE_MIN_SHORT_EDGE = 600;

export type ImagePurpose = "identity" | "property";

export type ImageCompressionPolicy = {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  initialQuality: number;
};

export const imageCompressionPolicies: Record<ImagePurpose, ImageCompressionPolicy> = {
  identity: { maxSizeMB: 1.2, maxWidthOrHeight: 2560, initialQuality: 0.88 },
  property: { maxSizeMB: 0.8, maxWidthOrHeight: 1920, initialQuality: 0.85 },
};

export function validateImageFile(file: File) {
  if (!IMAGE_ALLOWED_TYPES.includes(file.type as (typeof IMAGE_ALLOWED_TYPES)[number])) {
    return "僅支援 JPG、PNG 圖片。";
  }
  if (file.size <= 0 || file.size > IMAGE_MAX_INPUT_BYTES) {
    return "每張原始圖片不得超過 5MB。";
  }
  return null;
}

export function validateIdentityImageDimensions(width: number, height: number) {
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "無法讀取圖片尺寸，請重新選擇 JPG 或 PNG 圖片。";
  }
  if (longEdge < IDENTITY_IMAGE_MIN_LONG_EDGE || shortEdge < IDENTITY_IMAGE_MIN_SHORT_EDGE) {
    return `圖片解析度不足；長邊至少 ${IDENTITY_IMAGE_MIN_LONG_EDGE}px、短邊至少 ${IDENTITY_IMAGE_MIN_SHORT_EDGE}px。`;
  }
  return null;
}

export function formatImageBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function canAddPropertyImages(existingCount: number, incomingCount: number) {
  return existingCount >= 0 && incomingCount > 0 && existingCount + incomingCount <= PROPERTY_IMAGE_LIMIT;
}
