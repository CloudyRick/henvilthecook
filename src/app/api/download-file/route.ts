import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { getFileSignedUrl } from "@/lib/s3";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let user = null;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const anonClient = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await anonClient.auth.getUser(token);
    user = data.user;
  }

  if (!user) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("has_paid")
    .eq("id", user.id)
    .single();

  if (!profile?.has_paid) {
    return NextResponse.json({ error: "Purchase required" }, { status: 403 });
  }

  const { data: section } = await supabase
    .from("content_sections")
    .select("file_key, file_name")
    .eq("id", id)
    .single();

  if (!section?.file_key || !section?.file_name) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const url = await getFileSignedUrl(section.file_key, section.file_name);
  return NextResponse.json({ url });
}
