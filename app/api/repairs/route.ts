import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createRepairRequest,
  type RepairAttachmentUploadInput,
} from "@/lib/db/repairs";
import { repairRequestSchema } from "@/lib/validations/repair-request";

const maxUploadSizeBytes = 8 * 1024 * 1024;
const maxImageFilesPerType = 5;
const maxTotalAttachments = 11;

type ParsedRequestPayload = {
  payload: unknown;
  attachments: RepairAttachmentUploadInput[];
};

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: FormDataEntryValue | null): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return value === "true" || value === "on" || value === "1";
}

function getFiles(formData: FormData, key: string): File[] {
  return formData.getAll(key).filter((entry): entry is File => entry instanceof File);
}

function assertAttachmentLimits(attachments: File[], kind: "image" | "proof") {
  for (const file of attachments) {
    if (file.size === 0) {
      continue;
    }

    if (file.size > maxUploadSizeBytes) {
      throw new Error(
        `File "${file.name}" exceeds the ${Math.floor(maxUploadSizeBytes / (1024 * 1024))}MB upload limit.`,
      );
    }

    const mime = file.type.toLowerCase();
    if (kind === "image" && !mime.startsWith("image/")) {
      throw new Error(`File "${file.name}" must be an image.`);
    }

    if (kind === "proof" && !(mime.startsWith("image/") || mime === "application/pdf")) {
      throw new Error(`File "${file.name}" must be an image or PDF.`);
    }
  }
}

async function toAttachmentUploads(
  files: File[],
  labelPrefix: string,
): Promise<RepairAttachmentUploadInput[]> {
  const uploads: RepairAttachmentUploadInput[] = [];

  for (const [index, file] of files.entries()) {
    if (file.size === 0) {
      continue;
    }

    uploads.push({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileBytes: new Uint8Array(await file.arrayBuffer()),
      fileLabel: `${labelPrefix} ${index + 1}: ${file.name}`,
    });
  }

  return uploads;
}

async function parseMultipartRequest(request: Request): Promise<ParsedRequestPayload> {
  const formData = await request.formData();
  const itemImages = getFiles(formData, "itemImages");
  const damageImages = getFiles(formData, "damageImages");
  const proofFiles = getFiles(formData, "proofOfPurchase");

  if (itemImages.length > maxImageFilesPerType) {
    throw new Error(`You can upload up to ${maxImageFilesPerType} item images.`);
  }

  if (damageImages.length > maxImageFilesPerType) {
    throw new Error(`You can upload up to ${maxImageFilesPerType} damage images.`);
  }

  if (proofFiles.length > 1) {
    throw new Error("You can upload only one proof of purchase file.");
  }

  const totalAttachments =
    itemImages.length + damageImages.length + proofFiles.length;
  if (totalAttachments > maxTotalAttachments) {
    throw new Error(`Too many attachments. Maximum allowed is ${maxTotalAttachments}.`);
  }

  assertAttachmentLimits(itemImages, "image");
  assertAttachmentLimits(damageImages, "image");
  assertAttachmentLimits(proofFiles, "proof");

  const [itemUploads, damageUploads, proofUploads] = await Promise.all([
    toAttachmentUploads(itemImages, "Item image"),
    toAttachmentUploads(damageImages, "Damage image"),
    toAttachmentUploads(proofFiles, "Proof of purchase"),
  ]);

  return {
    payload: {
      customerName: asString(formData.get("customerName")),
      phone: asString(formData.get("phone")),
      email: asString(formData.get("email")),
      preferredContactMethod: asString(formData.get("preferredContactMethod")),
      itemType: asString(formData.get("itemType")),
      brand: asString(formData.get("brand")),
      model: asString(formData.get("model")),
      serialNumber: asString(formData.get("serialNumber")),
      purchaseDate: asString(formData.get("purchaseDate")),
      serviceType: asString(formData.get("serviceType")),
      description: asString(formData.get("description")),
      dropOffMethod: asString(formData.get("dropOffMethod")),
      privacyAccepted: asBoolean(formData.get("privacyAccepted")),
      serviceTermsAccepted: asBoolean(formData.get("serviceTermsAccepted")),
    },
    attachments: [...itemUploads, ...damageUploads, ...proofUploads],
  };
}

async function parseRequest(request: Request): Promise<ParsedRequestPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartRequest(request);
  }

  const payload = await request.json();
  return { payload, attachments: [] };
}

export async function POST(request: Request) {
  try {
    const { payload: rawPayload, attachments } = await parseRequest(request);
    const payload = repairRequestSchema.parse(rawPayload);
    const result = await createRepairRequest(payload, attachments);

    return NextResponse.json({
      ok: true,
      repairCode: result.repairCode,
      attachmentsUploaded: attachments.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid repair request payload.", issues: error.issues },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected repair request creation error.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
