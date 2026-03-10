import { z } from "zod";

export const repairTrackSchema = z
  .object({
    repairCode: z.string().trim().min(6),
    phoneOrEmail: z.string().trim().min(5),
  })
  .refine(
    (data) => {
      return data.phoneOrEmail.includes("@") || /\d/.test(data.phoneOrEmail);
    },
    {
      message: "Provide a valid phone number or email.",
      path: ["phoneOrEmail"],
    },
  );

export type RepairTrackInput = z.infer<typeof repairTrackSchema>;
