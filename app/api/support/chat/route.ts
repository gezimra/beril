import { NextResponse } from "next/server";
import { z } from "zod";

import { addSupportMessage, createSupportThread } from "@/lib/db/crm-support";
import { supportChannels } from "@/types/domain";

const createThreadSchema = z.object({
  threadId: z.string().trim().optional(),
  subject: z.string().trim().min(3).optional(),
  message: z.string().trim().min(2),
  customerName: z.string().trim().min(2).optional(),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  customerPhone: z.string().trim().optional(),
  channel: z.enum(supportChannels).default("web_chat"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = createThreadSchema.parse(json);

    if (payload.threadId) {
      await addSupportMessage({
        threadId: payload.threadId,
        direction: "inbound",
        message: payload.message,
        senderName: payload.customerName ?? null,
        senderEmail: payload.customerEmail || null,
        senderPhone: payload.customerPhone ?? null,
      });

      return NextResponse.json({
        ok: true,
        threadId: payload.threadId,
        mode: "message",
      });
    }

    const subject = payload.subject?.trim() || "Live chat support";

    const result = await createSupportThread({
      subject,
      message: payload.message,
      channel: payload.channel,
      customerName: payload.customerName ?? null,
      customerEmail: payload.customerEmail || null,
      customerPhone: payload.customerPhone ?? null,
    });

    return NextResponse.json({
      ok: true,
      threadId: result.threadId,
      mode: "thread",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid chat payload." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected support chat error.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

