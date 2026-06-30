"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
