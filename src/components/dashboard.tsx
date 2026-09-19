import { useEffect, useMemo, useState } from "react";
import type { CyberUser } from "@/lib/auth";
import { signOut, refreshRole, touchLastLogin } from "@/lib/auth";
import {
  watchResources,
  addResource,
  updateResource,
  deleteResource,
  type CyberResource,
} from "@/lib/resources";
import { CyberBot } from "./cyberbot";

const CATEGORIES = ["all", "app", "course", "method", "tool", "video"] as const;

const catBadge: Record<string, string> = {
  app: "bg-primary/15 text-primary",
  course: "bg-accent/15 text-accent",
  method: "bg-[#10b981]/15 text-[#10b981]",
  tool: "bg-[#f59e0b]/15 text-[#f59e0b]",
  video: "bg-[#ec4899]/15 text-[#ec4899]",
};

const inputCls =
  "w-full rounded-lg border border-input bg-[#0c1119] px-3.5 py-2.5 text-sm text-foreground placeholder:text-[#566180] focus:border-primary focus:outline-none transition-colors";

type Tab = "catalog" | "bot" | "saved" | "admin";

export function Dashboard({ user, onRoleChange, onSignOut }: {
  user: CyberUser;
  onRoleChange: (isAdmin: boolean) => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("catalog");
  const [resources, setResources] = useState<CyberResource[]>([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`ct_saved_${user.uid}`) ?? "[]");
    } catch {
      return [];
    }
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    touchLastLogin(user.uid);
    return watchResources(setResources);
  }, [user.uid]);

  useEffect(() => {
    localStorage.setItem(`ct_saved_${user.uid}`, JSON.stringify(saved));
  }, [saved, user.uid]);

  const filtered = useMemo(
    () =>
      resources.filter(
        (r) =>
          (cat === "all" || r.category === cat) &&
          (r.title + " " + r.subtitle + " " + r.description)
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [resources, search, cat]
  );

  const toggleSave = (id: string) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "catalog", label: "Catalog", icon: "▦" },
    { id: "bot", label: "CyberBot", icon: "◈" },
    { id: "saved", label: "Saved", icon: "★" },
    ...(user.isAdmin ? [{ id: "admin" as Tab, label: "Admin", icon: "⚙" }] : []),
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-background pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg font-black text-primary-foreground">
          C
        </div>
        <div className="flex-1">
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-base font-extrabold text-transparent">
            CYBERTOOL
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {user.isAdmin ? "Admin Console" : "Resource Hub"}
          </p>
        </div>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-sm font-bold text-primary"
        >
          {(user.name || user.email || "G")[0]!.toUpperCase()}
        </button>
      </header>

      {/* Profile sheet */}
      {profileOpen && (
        <div className="border-b border-border bg-card px-4 py-4">
          <p className="text-sm font-bold text-foreground">
            {user.name || (user.isAnonymous ? "Guest" : "User")}
          </p>
          <p className="text-xs text-muted-foreground">{user.email ?? "Anonymous session"}</p>
          <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">
            UID: {user.uid}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(user.uid);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-bold text-foreground"
            >
              {copied ? "Copied!" : "Copy UID"}
            </button>
            <button
              onClick={async () => onRoleChange(await refreshRole(user.uid))}
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
            >
              Check Role
            </button>
            <button
              onClick={async () => {
                await signOut();
                onSignOut();
              }}
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive"
            >
              Sign Out
            </button>
          </div>
          {!user.isAdmin && (
            <p className="mt-3 rounded-lg border border-border bg-secondary/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
              To become admin: copy your UID, open Firebase Console → Realtime Database →
              users → your UID, and set <span className="font-mono text-primary">isAdmin</span> to{" "}
              <span className="font-mono text-primary">true</span>. Then tap "Check Role".
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 py-4">
        {tab === "catalog" && (
          <CatalogView
            items={filtered}
            search={search}
            setSearch={setSearch}
            cat={cat}
            setCat={setCat}
            saved={saved}
            toggleSave={toggleSave}
          />
        )}
        {tab === "bot" && <CyberBot resources={resources} />}
        {tab === "saved" && (
          <CatalogView
            items={resources.filter((r) => saved.includes(r.id))}
            search={search}
            setSearch={setSearch}
            cat={cat}
            setCat={setCat}
            saved={saved}
            toggleSave={toggleSave}
            hideFilters
          />
        )}
        {tab === "admin" && user.isAdmin && <AdminPanel resources={resources} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${
                tab === t.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function CatalogView({
  items, search, setSearch, cat, setCat, saved, toggleSave, hideFilters,
}: {
  items: CyberResource[];
  search: string;
  setSearch: (s: string) => void;
  cat: string;
  setCat: (c: string) => void;
  saved: string[];
  toggleSave: (id: string) => void;
  hideFilters?: boolean;
}) {
  return (
    <div className="space-y-3">
      {!hideFilters && (
        <>
          <input
            className={inputCls}
            placeholder="Search tools, courses, methods…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-colors ${
                  cat === c
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                    : "border border-border bg-secondary text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-2xl">▦</p>
          <p className="mt-2 text-sm font-semibold text-foreground">Nothing here yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Content published by the admin will appear here instantly.
          </p>
        </div>
      )}
      {items.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            {r.logo ? (
              <img src={r.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 text-lg font-black text-primary">
                {r.title[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold text-foreground">{r.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${catBadge[r.category] ?? ""}`}>
                  {r.category}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
            </div>
            <button
              onClick={() => toggleSave(r.id)}
              className={`text-lg ${saved.includes(r.id) ? "text-[#f59e0b]" : "text-muted-foreground"}`}
            >
              {saved.includes(r.id) ? "★" : "☆"}
            </button>
          </div>
          {r.description && (
            <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {r.description}
            </p>
          )}
          {r.link && (
            <a
              href={r.link}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Open / Download
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminPanel({ resources }: { resources: CyberResource[] }) {
  const empty = { title: "", subtitle: "", description: "", category: "tool" as CyberResource["category"], link: "", logo: "" };
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      if (editId) await updateResource(editId, form);
      else await addResource(form);
      setForm(empty);
      setEditId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold text-foreground">
          {editId ? "Edit Resource" : "Add New Resource"}
        </h2>
        <div className="space-y-2.5">
          <input className={inputCls} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={inputCls} placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <textarea className={inputCls + " min-h-20"} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CyberResource["category"] })}>
            <option value="app">App</option>
            <option value="course">Course</option>
            <option value="method">Method</option>
            <option value="tool">Tool</option>
            <option value="video">Video</option>
          </select>
          <input className={inputCls} placeholder="Logo image URL (optional)" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
          <input className={inputCls} placeholder="Download / open link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="flex-1 rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50">
              {busy ? "Saving…" : editId ? "Update" : "Publish"}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(empty); }} className="rounded-lg border border-border px-4 text-xs font-bold text-muted-foreground">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Published ({resources.length})
        </h3>
        {resources.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{r.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{r.category}</p>
            </div>
            <button
              onClick={() => {
                setEditId(r.id);
                setForm({ title: r.title, subtitle: r.subtitle, description: r.description, category: r.category, link: r.link, logo: r.logo });
              }}
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
            >
              Edit
            </button>
            <button
              onClick={() => deleteResource(r.id)}
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
