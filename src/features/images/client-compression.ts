import imageCompression from "browser-image-compression";
import { imageCompressionPolicies, validateImageFile, type ImagePurpose } from "@/features/images/policy";

const SELF_HOSTED_WORKER_URL = "/vendor/browser-image-compression.js";

export async function compressImageFile(
  file: File,
  purpose: ImagePurpose,
  onProgress?: (progress: number) => void,
) {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const policy = imageCompressionPolicies[purpose];
  const compressed = await imageCompression(file, {
    ...policy,
    fileType: "image/jpeg",
    preserveExif: false,
    useWebWorker: true,
    libURL: SELF_HOSTED_WORKER_URL,
    maxIteration: 10,
    onProgress,
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([compressed], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
