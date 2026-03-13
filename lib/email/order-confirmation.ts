import { Resend } from "resend";

import { env } from "@/lib/env";
import { siteConfig } from "@/lib/site";
import { formatEur } from "@/lib/utils/money";
import type { Locale } from "@/lib/i18n";

interface OrderConfirmationInput {
  to: string;
  locale: Locale;
  customerName: string;
  orderCode: string;
  items: Array<{ title: string; brand: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  deliveryMethod: string;
  paymentMethod: string;
}

const copy = {
  sq: {
    subject: (code: string) => `Porosia juaj ${code} u pranua — BERIL`,
    greeting: (name: string) => `Pershendetje ${name},`,
    intro: "Porosia juaj u pranua me sukses. Do t'ju kontaktojme per konfirmim dhe dorezim.",
    orderCode: "Kodi i porosise",
    items: "Produktet",
    subtotal: "Nentotali",
    delivery: "Dergesa",
    discount: "Zbritja",
    total: "Totali",
    deliveryMethod: "Menyra e dergeses",
    paymentMethod: "Menyra e pageses",
    trackCta: "Gjurmo Porosine",
    trackNote: "Perdor kodin e porosise dhe numrin tend te telefonit ose email per te gjurmuar statusin.",
    deliveryMethods: {
      home_delivery: "Dergese ne shtepi",
      store_pickup: "Terheqje ne dyqan",
    } as Record<string, string>,
    paymentMethods: {
      cash_on_delivery: "Pagese ne dorezim",
      pay_in_store: "Pagese ne dyqan",
      card_online: "Karte online",
      bank_transfer: "Transfer bankar",
    } as Record<string, string>,
    footer: "Faleminderit qe zgjodhët BERIL.",
    contact: `Per pyetje: ${siteConfig.email} | ${siteConfig.phoneLabel}`,
  },
  en: {
    subject: (code: string) => `Your order ${code} is confirmed — BERIL`,
    greeting: (name: string) => `Hello ${name},`,
    intro: "Your order has been received. We will contact you to confirm availability and arrange delivery.",
    orderCode: "Order Code",
    items: "Items",
    subtotal: "Subtotal",
    delivery: "Delivery",
    discount: "Discount",
    total: "Total",
    deliveryMethod: "Delivery method",
    paymentMethod: "Payment method",
    trackCta: "Track Order",
    trackNote: "Use your order code and the phone or email you provided to check your order status.",
    deliveryMethods: {
      home_delivery: "Home delivery",
      store_pickup: "Store pickup",
    } as Record<string, string>,
    paymentMethods: {
      cash_on_delivery: "Cash on delivery",
      pay_in_store: "Pay in store",
      card_online: "Card online",
      bank_transfer: "Bank transfer",
    } as Record<string, string>,
    footer: "Thank you for choosing BERIL.",
    contact: `Questions? ${siteConfig.email} | ${siteConfig.phoneLabel}`,
  },
} as const;

function buildHtml(input: OrderConfirmationInput): string {
  const t = copy[input.locale];
  const siteUrl = env.client.siteUrl.replace(/\/+$/, "");
  const trackUrl = `${siteUrl}/orders/track`;

  const itemRows = input.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #ede9e3;font-size:14px;color:#3a3530;">
          ${item.brand} ${item.title}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #ede9e3;font-size:14px;color:#3a3530;text-align:right;white-space:nowrap;">
          ${item.quantity} &times; ${formatEur(item.unitPrice)}
        </td>
      </tr>`,
    )
    .join("");

  const discountRow =
    input.discountAmount > 0
      ? `<tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;">${t.discount}</td>
          <td style="padding:4px 0;font-size:13px;color:#5a8a72;text-align:right;">-${formatEur(input.discountAmount)}</td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="${input.locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${t.subject(input.orderCode)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f1eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <p style="margin:0;font-size:22px;letter-spacing:0.2em;color:#3a3530;font-weight:normal;text-transform:uppercase;">
                BERIL
              </p>
              <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.14em;color:#8a7f74;text-transform:uppercase;">
                ${siteConfig.location}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#faf8f4;border-radius:16px;padding:32px 28px;">

              <p style="margin:0 0 16px;font-size:15px;color:#3a3530;">${t.greeting(input.customerName)}</p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b6258;line-height:1.6;">${t.intro}</p>

              <!-- Order code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#fff;border:1px solid #e8e2da;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a7f74;">
                      ${t.orderCode}
                    </p>
                    <p style="margin:0;font-size:22px;font-weight:600;color:#3a3530;letter-spacing:0.04em;">
                      ${input.orderCode}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Items -->
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a7f74;">
                ${t.items}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                ${itemRows}
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#6b7280;">${t.subtotal}</td>
                  <td style="padding:4px 0;font-size:13px;color:#3a3530;text-align:right;">${formatEur(input.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#6b7280;">${t.delivery}</td>
                  <td style="padding:4px 0;font-size:13px;color:#3a3530;text-align:right;">${formatEur(input.deliveryFee)}</td>
                </tr>
                ${discountRow}
                <tr>
                  <td style="padding:8px 0 4px;font-size:15px;font-weight:600;color:#3a3530;border-top:1px solid #e8e2da;">${t.total}</td>
                  <td style="padding:8px 0 4px;font-size:15px;font-weight:600;color:#3a3530;text-align:right;border-top:1px solid #e8e2da;">${formatEur(input.total)}</td>
                </tr>
              </table>

              <!-- Delivery / payment info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#f0ece5;border-radius:10px;padding:14px 16px;">
                <tr>
                  <td style="font-size:12px;color:#6b6258;padding:2px 0;">
                    ${t.deliveryMethod}: <strong>${t.deliveryMethods[input.deliveryMethod] ?? input.deliveryMethod}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#6b6258;padding:2px 0;">
                    ${t.paymentMethod}: <strong>${t.paymentMethods[input.paymentMethod] ?? input.paymentMethod}</strong>
                  </td>
                </tr>
              </table>

              <!-- Track CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td>
                    <a href="${trackUrl}" style="display:inline-block;background:#7a5c3a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:50px;font-size:13px;letter-spacing:0.06em;">
                      ${t.trackCta}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#8a7f74;line-height:1.5;">${t.trackNote}</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 8px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#6b6258;">${t.footer}</p>
              <p style="margin:0;font-size:11px;color:#8a7f74;">${t.contact}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(
  input: OrderConfirmationInput,
): Promise<void> {
  const apiKey = env.server.resendApiKey;
  if (!apiKey) {
    return;
  }

  const resend = new Resend(apiKey);
  const t = copy[input.locale];

  await resend.emails.send({
    from: `BERIL <orders@beril.store>`,
    to: input.to,
    subject: t.subject(input.orderCode),
    html: buildHtml(input),
  });
}
