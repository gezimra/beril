import { NextResponse } from "next/server";
import { z } from "zod";

import { createRepairRequest } from "@/lib/db/repairs";
import { repairRequestSchema } from "@/lib/validations/repair-request";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = repairRequestSchema.parse(json);
    const result = await createRepairRequest(payload);

    return NextResponse.json({ ok: true, repairCode: result.repairCode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid repair request payload.", issues: error.issues },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected repair request creation error.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
