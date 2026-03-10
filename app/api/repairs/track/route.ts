import { NextResponse } from "next/server";
import { z } from "zod";

import { trackRepairRequest } from "@/lib/db/repairs";
import { repairTrackSchema } from "@/lib/validations/repair-track";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = repairTrackSchema.parse(json);
    const result = await trackRepairRequest(payload);

    if (!result) {
      return NextResponse.json(
        { ok: false, message: "Repair request not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid tracking payload.", issues: error.issues },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected repair tracking error.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
