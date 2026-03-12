import { z } from "zod";

import { deliveryMethods, paymentMethods } from "@/types/domain";
import { phoneInputSchema } from "@/lib/validations/phone";

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2),
    phone: phoneInputSchema,
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
