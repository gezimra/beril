import { z } from "zod";
import { phoneInputSchema } from "@/lib/validations/phone";

export const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: phoneInputSchema,
  subject: z.string().trim().min(3),
  message: z.string().trim().min(8).max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;
