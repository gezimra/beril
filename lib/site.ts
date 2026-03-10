import { env } from "@/lib/env";

const defaultWhatsapp = (env.client.whatsappNumber ?? "38344000000").replace(
  /\D/g,
  "",
);

export const siteConfig = {
  name: "BERIL",
  location: "Gjilan, Kosovo",
  tagline: "Precision in Time & Vision",
  description:
    "Ora te kuruara, syze te rafinuara dhe servis i besuar ne Gjilan.",
  phoneLabel: "+383 44 000 000",
  phoneHref: "tel:+38344000000",
  email: "info@beril.store",
  whatsappHref: `https://wa.me/${defaultWhatsapp || "38344000000"}`,
};
