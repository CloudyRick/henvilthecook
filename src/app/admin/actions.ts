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

  await supabase
    .from("content_sections")
    .update({
      title,
      teaser,
      body,
      slug,
      sort_order: sortOrder,
      is_free_preview: isFreePreview,
      updated_at: new Date().toISOString(),
    })
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

export async function addSectionFile(formData: FormData) {
  const sectionId = formData.get("section_id") as string;
  const type = formData.get("type") as "image" | "file";
  const file = formData.get("file") as File;

  if (!file || file.size === 0) throw new Error("No file provided");

  const ext = file.name.split(".").pop();
  const key = `sections/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let url: string | null = null;
  if (type === "image") {
    url = await uploadPublicImage(key, buffer, file.type);
  } else {
    await uploadFile(key, buffer, file.type);
  }

  const supabase = await requireAdmin();
  const { data: existing } = await supabase
    .from("section_files")
    .select("sort_order")
    .eq("section_id", sectionId)
    .eq("type", type)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sortOrder = existing ? existing.sort_order + 1 : 0;

  await supabase.from("section_files").insert({
    section_id: sectionId,
    type,
    key,
    name: file.name,
    url,
    sort_order: sortOrder,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSectionFile(formData: FormData) {
  const id = formData.get("id") as string;
  const type = formData.get("type") as "image" | "file";
  const key = formData.get("key") as string;

  if (type === "image") {
    await deletePublicImage(key);
  } else {
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
      Key: key,
    }));
  }

  const supabase = await requireAdmin();
  await supabase.from("section_files").delete().eq("id", id);

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
