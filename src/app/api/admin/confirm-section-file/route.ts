import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { sectionId, type, key, fileName, url } = await request.json();

  const service = await createServiceClient();
  const { data: existing } = await service
    .from("section_files")
    .select("sort_order")
    .eq("section_id", sectionId)
    .eq("type", type)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sortOrder = existing ? existing.sort_order + 1 : 0;

  const { error: insertError } = await service.from("section_files").insert({
    section_id: sectionId,
    type,
    key,
    name: fileName,
    url: url ?? null,
    sort_order: sortOrder,
  });

  if (insertError) {
    console.error("DB insert error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
