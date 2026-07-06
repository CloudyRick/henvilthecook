import { createClient } from "@/lib/supabase/server";
import { getPresignedPutUrl } from "@/lib/s3";
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

  const { type, fileName, contentType } = await request.json();
  const ext = fileName.split(".").pop();
  const key = `sections/${crypto.randomUUID()}.${ext}`;

  const bucket = type === "image"
    ? process.env.OCI_PUBLIC_BUCKET_NAME!
    : process.env.OCI_S3_BUCKET_NAME!;

  const uploadUrl = await getPresignedPutUrl(bucket, key, contentType);

  const publicUrl = type === "image"
    ? `https://objectstorage.${process.env.OCI_S3_REGION!}.oraclecloud.com/n/${process.env.OCI_S3_NAMESPACE!}/b/${bucket}/o/${encodeURIComponent(key)}`
    : null;

  return NextResponse.json({ uploadUrl, key, publicUrl });
}
