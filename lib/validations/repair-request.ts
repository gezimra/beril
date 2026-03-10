import { z } from "zod";

import { preferredContactMethods } from "@/types/domain";

export const repairRequestSchema = z
  .object({
    customerName: z.string().trim().min(2),
    phone: z.string().trim().min(7),
    email: z.string().trim().email().optional().or(z.literal("")),
    preferredContactMethod: z.enum(preferredContactMethods),
    itemType: z.enum(["watch", "eyewear", "other"]),
    brand: z.string().trim().min(1),
    model: z.string().trim().min(1),
    serialNumber: z.string().trim().max(100).optional().or(z.literal("")),
    purchaseDate: z.string().optional().or(z.literal("")),
    serviceType: z.string().trim().min(2),
    description: z.string().trim().min(8).max(2000),
    dropOffMethod: z.enum([
      "bring_to_store",
      "already_dropped_off",
      "contact_me_first",
    ]),
    privacyAccepted: z.literal(true),
    serviceTermsAccepted: z.literal(true),
  })
  .superRefine((data, context) => {
    if (data.preferredContactMethod === "email" && !data.email) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required when preferred contact method is email.",
        path: ["email"],
      });
    }
  });

export type RepairRequestInput = z.infer<typeof repairRequestSchema>;
