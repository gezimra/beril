import { NextResponse } from "next/server";
import { z } from "zod";

import { lookupServiceItems } from "@/lib/db/inventory-ops";
import { createSupabaseServerClient } from "@/lib/db/supabase/server";

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(12).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Auth service is not configured." },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "owner") {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q"),
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid query parameters." },
      { status: 400 },
    );
  }

  const items = await lookupServiceItems({
    query: parsed.data.q,
    limit: parsed.data.limit ?? 6,
  });

  return NextResponse.json({ ok: true, items });
}
