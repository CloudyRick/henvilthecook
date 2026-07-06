"use client";

import { useRef, useState, useTransition } from "react";

function UploadForm({
  sectionId,
  type,
  label,
  accept,
  buttonClass,
}: {
  sectionId: string;
  type: "image" | "file";
  label: string;
  accept: string;
  buttonClass: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = formRef.current?.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0];
    if (!file) return;

    setError(null);
    startTransition(async () => {
      // Step 1: get presigned PUT URL
      const urlRes = await fetch("/api/admin/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fileName: file.name, contentType: file.type }),
      });
      if (!urlRes.ok) {
        const d = await urlRes.json().catch(() => ({}));
        setError(d.error || "Failed to get upload URL");
        return;
      }
      const { uploadUrl, key, publicUrl } = await urlRes.json();

      // Step 2: PUT directly to OCI (bypasses Next.js body limit)
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        setError(`OCI upload failed (${putRes.status})`);
        return;
      }

      // Step 3: save record to DB
      const confirmRes = await fetch("/api/admin/confirm-section-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, type, key, fileName: file.name, url: publicUrl }),
      });
      if (!confirmRes.ok) {
        const d = await confirmRes.json().catch(() => ({}));
        setError(d.error || "Failed to save record");
        return;
      }

      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-600">{label}</label>
        <input
          name="file"
          type="file"
          accept={accept}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-700 hover:file:bg-amber-100"
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
      <button type="submit" disabled={isPending} className={`${buttonClass} disabled:opacity-50`}>
        {isPending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

export default function SectionFileUpload({ sectionId }: { sectionId: string }) {
  return (
    <>
      <UploadForm
        sectionId={sectionId}
        type="image"
        label="Add Image (visible to all)"
        accept="image/*"
        buttonClass="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
      />
      <UploadForm
        sectionId={sectionId}
        type="file"
        label="Add File (paid users only)"
        accept=".pdf,.doc,.docx"
        buttonClass="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
      />
    </>
  );
}
