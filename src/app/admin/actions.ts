"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadFile, uploadPublicImage, deletePublicImage } from "@/lib/s3";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Forbidden");

  return createServiceClient();
}

export async function updateSiteContent(formData: FormData) {
  const supabase = await requireAdmin();

  const entries = Array.from(formData.entries());
  for (const [key, value] of entries) {
    if (key.startsWith("site_")) {
      const siteKey = key.replace("site_", "");
      await supabase
        .from("site_content")
        .update({ value: value as string, updated_at: new Date().toISOString() })
        .eq("key", siteKey);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSection(formData: FormData) {
  const supabase = await requireAdmin();

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const teaser = formData.get("teaser") as string;
  const body = formData.get("body") as string;
  const slug = formData.get("slug") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string, 10);
  const isFreePreview = formData.get("is_free_preview") === "on";

  const updates: Record<string, unknown> = {
    title,
    teaser,
    body,
    slug,
    sort_order: sortOrder,
    is_free_preview: isFreePreview,
    updated_at: new Date().toISOString(),
  };

  const file = formData.get("file") as File | null;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const fileKey = `sections/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(fileKey, buffer, file.type);
    updates.file_key = fileKey;
    updates.file_name = file.name;
  }

  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    const ext = image.name.split(".").pop();
    const imageKey = `sections/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    const imageUrl = await uploadPublicImage(imageKey, buffer, image.type);
    updates.image_key = imageKey;
    updates.image_url = imageUrl;
  }

  await supabase.from("content_sections").update(updates).eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeDownloadFromSection(formData: FormData) {
  const id = formData.get("id") as string;
  const fileKey = formData.get("file_key") as string;

  const s3 = new S3Client({
    region: process.env.OCI_S3_REGION!,
    endpoint: `https://${process.env.OCI_S3_NAMESPACE!}.compat.objectstorage.${process.env.OCI_S3_REGION!}.oraclecloud.com`,
    credentials: {
      accessKeyId: process.env.OCI_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.OCI_S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.OCI_S3_BUCKET_NAME!,
    Key: fileKey,
  }));

  const supabase = await requireAdmin();
  await supabase
    .from("content_sections")
    .update({ file_key: null, file_name: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createSection(formData: FormData) {
  const supabase = await requireAdmin();

  const title = formData.get("title") as string;
  const teaser = formData.get("teaser") as string;
  const body = formData.get("body") as string;
  const slug = formData.get("slug") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string, 10);
  const isFreePreview = formData.get("is_free_preview") === "on";

  await supabase.from("content_sections").insert({
    title,
    teaser,
    body,
    slug,
    sort_order: sortOrder,
    is_free_preview: isFreePreview,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSection(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;

  await supabase.from("content_sections").delete().eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addTestimonial(formData: FormData) {
  const supabase = await requireAdmin();

  const file = formData.get("image") as File;
  if (!file || file.size === 0) throw new Error("No image provided");

  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("testimonials")
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage
    .from("testimonials")
    .getPublicUrl(fileName);

  const sortOrder = parseInt(formData.get("sort_order") as string, 10) || 0;

  await supabase.from("testimonials").insert({
    image_url: urlData.publicUrl,
    sort_order: sortOrder,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteTestimonial(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const imageUrl = formData.get("image_url") as string;

  const fileName = imageUrl.split("/").pop();
  if (fileName) {
    await supabase.storage.from("testimonials").remove([fileName]);
  }

  await supabase.from("testimonials").delete().eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeImageFromSection(formData: FormData) {
  const id = formData.get("id") as string;
  const imageKey = formData.get("image_key") as string;

  await deletePublicImage(imageKey);

  const supabase = await requireAdmin();
  await supabase
    .from("content_sections")
    .update({ image_key: null, image_url: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin");
}

