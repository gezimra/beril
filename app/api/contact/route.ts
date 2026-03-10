import { NextResponse } from "next/server";
import { z } from "zod";

import { createContactInquiry } from "@/lib/db/admin";
import { createSupportThread } from "@/lib/db/crm-support";
import { contactSchema } from "@/lib/validations/contact";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = contactSchema.parse(json);
    await createContactInquiry(payload);
    await createSupportThread({
      subject: payload.subject,
      message: payload.message,
      channel: "email",
      customerName: payload.name,
      customerEmail: payload.email,
      customerPhone: payload.phone,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid contact payload.", issues: error.issues },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected contact submission error.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
