"use client";
import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import AdminModal from "@/components/Admin/AdminModal";
import { useLocalCollection } from "@/lib/adminStore";
import { services as seedServices } from "@/lib/siteContent";
import type { ServiceContent } from "@/types/content";
const blank: ServiceContent = {
  slug: "",
  title: "",
  seoTitle: "",
  eyebrow: "",
  intro: "",
  body: [""],
  image: "",
  highlights: [],
};
export default function AdminServices() {
  const { items, setItems, reset } = useLocalCollection<ServiceContent>(
    "ca-admin-services",
    seedServices,
  );
  const [editing, setEditing] = useState<ServiceContent | null>(null);
  const [form, setForm] = useState<ServiceContent>(blank);
  const edit = (item?: ServiceContent) => {
    const value = item || blank;
    setEditing({ ...value });
    setForm({
      ...value,
      body: [...value.body],
      highlights: [...value.highlights],
    });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const slug =
      form.slug ||
      form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const next = {
      ...form,
      slug,
      body: form.body.filter(Boolean),
      highlights: form.highlights.filter(Boolean),
    };
    setItems((current) =>
      editing?.slug
        ? current.map((i) => (i.slug === editing.slug ? next : i))
        : [...current, next],
    );
    setEditing(null);
  };
  const remove = async (slug: string, title: string) => {
    const confirmation = await Swal.fire({ icon: "warning", title: `Delete “${title}”?`, text: "This local service entry will be removed from this browser.", showCancelButton: true, confirmButtonText: "Delete service", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (confirmation.isConfirmed) setItems((current) => current.filter((item) => item.slug !== slug));
  };
  return (
    <>
      <div className="admin-page-head">
        <div>
          <span>Website structure</span>
          <h1>Services</h1>
          <p>Manage service-page content, images and route-ready metadata.</p>
        </div>
        <button className="admin-primary" onClick={() => edit()}>
          + New service
        </button>
      </div>
      <div className="admin-toolbar">
        <span>{items.length} service routes</span>
        <button onClick={reset}>Reset mock data</button>
      </div>
      <div className="admin-card-grid">
        {items.map((item) => (
          <article className="admin-content-card" key={item.slug}>
            <img src={item.image || "/images/hero-left-car.jpg"} alt="" />
            <div>
              <span>{item.eyebrow}</span>
              <h2>{item.title}</h2>
              <p>{item.intro}</p>
              <small>/services/{item.slug}</small>
              <div className="table-actions">
                <button onClick={() => edit(item)}>Edit</button>
                <button className="admin-danger" onClick={() => void remove(item.slug, item.title)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {editing ? (
        <AdminModal
          title={editing.slug ? "Edit service" : "New service"}
          onClose={() => setEditing(null)}
        >
          <form className="admin-form" onSubmit={submit}>
            <label>
              Service name
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              SEO title
              <input
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              />
            </label>
            <div className="admin-form-row">
              <label>
                Eyebrow
                <input
                  value={form.eyebrow}
                  onChange={(e) =>
                    setForm({ ...form, eyebrow: e.target.value })
                  }
                />
              </label>
              <label>
                Slug
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </label>
            </div>
            <label>
              Hero image URL
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </label>
            <label>
              Intro
              <textarea
                rows={4}
                value={form.intro}
                onChange={(e) => setForm({ ...form, intro: e.target.value })}
              />
            </label>
            <label>
              Body paragraphs
              <textarea
                rows={6}
                value={form.body.join("\n\n")}
                onChange={(e) =>
                  setForm({ ...form, body: e.target.value.split(/\n\s*\n/) })
                }
              />
            </label>
            <label>
              Highlights (one per line)
              <textarea
                rows={5}
                value={form.highlights.join("\n")}
                onChange={(e) =>
                  setForm({ ...form, highlights: e.target.value.split("\n") })
                }
              />
            </label>
            <div className="admin-form-actions">
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="admin-primary" type="submit">
                Save service
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </>
  );
}
