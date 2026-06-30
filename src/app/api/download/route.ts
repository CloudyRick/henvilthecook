import { createClient } from "@/lib/supabase/server";
import { getDownloadUrl, isS3Configured } from "@/lib/s3";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_paid")
    .eq("id", user.id)
    .single();

  if (!profile?.has_paid) {
    return NextResponse.json({ error: "Payment required" }, { status: 403 });
  }

  if (!isS3Configured()) {
    return NextResponse.json(
      { error: "PDF download is not available yet. S3 storage is not configured." },
      { status: 503 }
    );
  }

  const url = await getDownloadUrl();
  return NextResponse.json({ url });
}
