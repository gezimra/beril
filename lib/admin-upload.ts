import type { ActionResult } from "@/lib/types/action-result";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export function validateUploadFile(
  file: FormDataEntryValue | null,
  options?: { requireImage?: boolean },
): ActionResult & { file?: File; fileBytes?: Uint8Array } {
  // This is a sync check - we return an object with the validated info
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No file provided or file is empty." };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { success: false, error: `File exceeds maximum size of ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} MB.` };
  }

  if (options?.requireImage && !file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image (JPEG, PNG, WebP, etc.)." };
  }

  return { success: true, file };
}

export async function getFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

export { MAX_UPLOAD_SIZE_BYTES };
