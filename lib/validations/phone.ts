import { z } from "zod";

export const phoneInputRegex = /^\+?[0-9\s\-()]{7,24}$/;

export const phoneInputSchema = z
  .string()
  .trim()
  .min(7, "Provide a valid phone number.")
  .max(24, "Provide a valid phone number.")
  .regex(phoneInputRegex, "Provide a valid phone number.");

export const optionalPhoneInputSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => value === undefined || value.length === 0 || phoneInputRegex.test(value),
    "Provide a valid phone number.",
  );
