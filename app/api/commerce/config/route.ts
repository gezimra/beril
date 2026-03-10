import { NextResponse } from "next/server";

import { getSiteSettings } from "@/lib/db/site-settings";

const fallbackHomeDeliveryFee = 3;

function resolveHomeDeliveryFee(value: string) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallbackHomeDeliveryFee;
  }
  return parsed;
}

export async function GET() {
  const settings = await getSiteSettings();
  const homeDeliveryFee = resolveHomeDeliveryFee(settings.homeDeliveryFee);

  return NextResponse.json({
    ok: true,
    homeDeliveryFee,
  });
}
