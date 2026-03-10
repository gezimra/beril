import { z } from "zod";

import { deliveryMethods, paymentMethods } from "@/types/domain";

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(24)
      .regex(/^\+?[0-9\s\-()]{7,24}$/, "Provide a valid phone number."),
    email: z.string().trim().email().optional().or(z.literal("")),
    country: z.string().trim().min(2),
    city: z.string().trim().min(2),
    address: z.string().trim().min(4),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    couponCode: z.string().trim().max(40).optional().or(z.literal("")),
    affiliateCode: z.string().trim().max(40).optional().or(z.literal("")),
    deliveryMethod: z.enum(deliveryMethods),
    paymentMethod: z.enum(paymentMethods),
  })
  .superRefine((data, context) => {
    if (
      data.deliveryMethod === "home_delivery" &&
      data.paymentMethod === "pay_in_store"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pay in store is only valid with store pickup.",
        path: ["paymentMethod"],
      });
    }

    if (
      data.deliveryMethod === "store_pickup" &&
      data.paymentMethod === "cash_on_delivery"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cash on delivery is only valid with home delivery.",
        path: ["paymentMethod"],
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
