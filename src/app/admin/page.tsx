import { createClient } from "@/lib/supabase/server";
import { updateSiteContent, updateSection, createSection, deleteSection, addTestimonial, deleteTestimonial, removeDownloadFromSection, removeImageFromSection } from "./actions";
import type { ContentSection, SiteContent, Purchase, Testimonial } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: siteContentRows } = await supabase
    .from("site_content")
    .select("*")
    .order("id");

  const { data: sections } = await supabase
    .from("content_sections")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: purchases } = await supabase
    .from("purchases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const totalRevenue = (purchases as Purchase[] | null)?.reduce(
    (sum, p) => sum + p.amount,
    0
  ) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <a href="/" className="text-amber-600 hover:text-amber-700">
            ← Back to site
          </a>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-3xl font-bold text-gray-900">
              {(purchases as Purchase[] | null)?.length ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              ${(totalRevenue / 100).toFixed(2)} AUD
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Site Settings</h2>
          <form action={updateSiteContent} className="space-y-4">
            {(siteContentRows as SiteContent[] | null)?.map((item) => (
              <div key={item.id}>
                <label className="block text-sm font-medium text-gray-700">
                  {item.key.replace(/_/g, " ")}
                </label>
                <input
                  name={`site_${item.key}`}
                  defaultValue={item.value}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            ))}
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-6 py-2 font-semibold text-white hover:bg-amber-700"
            >
              Save Settings
            </button>
          </form>
        </section>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Content Sections</h2>

          <div className="space-y-6">
            {(sections as ContentSection[] | null)?.map((section) => (
              <div key={section.id} className="rounded-lg border border-gray-200 p-4">
                <form action={updateSection} className="space-y-3">
                  <input type="hidden" name="id" value={section.id} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        name="title"
                        defaultValue={section.title}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Slug
                      </label>
                      <input
                        name="slug"
                        defaultValue={section.slug}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teaser (short subheading shown when collapsed)
                    </label>
                    <input
                      name="teaser"
                      defaultValue={section.teaser}
                      placeholder="e.g. What you'll learn in this chapter"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Body (Markdown)
                    </label>
                    <textarea
                      name="body"
                      rows={4}
                      defaultValue={section.body}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sort Order
                      </label>
                      <input
                        name="sort_order"
                        type="number"
                        defaultValue={section.sort_order}
                        className="mt-1 block w-20 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2 pt-5">
                      <input
                        name="is_free_preview"
                        type="checkbox"
                        defaultChecked={section.is_free_preview}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600"
                      />
                      <span className="text-sm text-gray-700">Free preview</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Downloadable File (optional — paid users only)
                    </label>
                    {section.file_name && (
                      <p className="mt-1 text-sm text-gray-600">
                        Current: <span className="font-medium">{section.file_name}</span>
                      </p>
                    )}
                    <input
                      name="file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-700 hover:file:bg-amber-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Body Image (optional — visible to all)
                    </label>
                    {section.image_url && (
                      <img
                        src={section.image_url}
                        alt="Section image"
                        className="mt-1 h-24 w-auto rounded-lg object-cover"
                      />
                    )}
                    <input
                      name="image"
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-700 hover:file:bg-amber-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                    >
                      Update
                    </button>
                  </div>
                </form>
                <div className="mt-2 flex gap-4">
                  <form action={deleteSection}>
                    <input type="hidden" name="id" value={section.id} />
                    <button type="submit" className="text-sm text-red-500 hover:text-red-700">
                      Delete section
                    </button>
                  </form>
                  {section.file_name && (
                    <form action={removeDownloadFromSection}>
                      <input type="hidden" name="id" value={section.id} />
                      <input type="hidden" name="file_key" value={section.file_key ?? ""} />
                      <button type="submit" className="text-sm text-red-400 hover:text-red-600">
                        Remove file
                      </button>
                    </form>
                  )}
                  {section.image_url && (
                    <form action={removeImageFromSection}>
                      <input type="hidden" name="id" value={section.id} />
                      <input type="hidden" name="image_key" value={section.image_key ?? ""} />
                      <button type="submit" className="text-sm text-red-400 hover:text-red-600">
                        Remove image
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Add New Section</h2>
          <form action={createSection} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  name="title"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  name="slug"
                  required
                  placeholder="my-section-slug"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teaser (short subheading shown when collapsed)
              </label>
              <input
                name="teaser"
                placeholder="e.g. What you'll learn in this chapter"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Body (Markdown)
              </label>
              <textarea
                name="body"
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sort Order
                </label>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={0}
                  className="mt-1 block w-20 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 pt-5">
                <input
                  name="is_free_preview"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-amber-600"
                />
                <span className="text-sm text-gray-700">Free preview</span>
              </label>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Add Section
            </button>
          </form>
        </section>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Testimonial Screenshots</h2>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {(testimonials as Testimonial[] | null)?.map((t) => (
              <div key={t.id} className="relative rounded-lg border border-gray-200 overflow-hidden">
                <img
                  src={t.image_url}
                  alt="Testimonial screenshot"
                  className="w-full h-auto"
                />
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <span className="text-xs text-gray-500">Order: {t.sort_order}</span>
                  <form action={deleteTestimonial}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="image_url" value={t.image_url} />
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {!(testimonials as Testimonial[] | null)?.length && (
              <p className="col-span-full text-gray-500 text-sm">No testimonials yet. Upload a screenshot below.</p>
            )}
          </div>

          <form action={addTestimonial} className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 p-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700">Screenshot</label>
              <input
                name="image"
                type="file"
                accept="image/*"
                required
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700">Sort Order</label>
              <input
                name="sort_order"
                type="number"
                defaultValue={0}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Upload
            </button>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Recent Purchases
          </h2>
          {(purchases as Purchase[] | null)?.length ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(purchases as Purchase[]).map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      ${(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                    </td>
                    <td className="py-2">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No purchases yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
