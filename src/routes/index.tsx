import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { watchAuth, ensureUserRecord, type CyberUser } from "@/lib/auth";
import { AuthScreen } from "@/components/auth-screen";
import { Dashboard } from "@/components/dashboard";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CYBERTOOL — Cyber Resource & Learning Hub" },
      {
        name: "description",
        content:
          "CYBERTOOL — your cyber resource and learning hub. Tools, courses, methods and an AI learning assistant. Learn. Practice. Secure.",
      },
      { property: "og:title", content: "CYBERTOOL — Cyber Resource & Learning Hub" },
      {
        property: "og:description",
        content: "Tools, courses, methods and an AI learning assistant. Learn. Practice. Secure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [user, setUser] = useState<CyberUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const u = getFirebaseAuth().currentUser;
    if (u) setUser(await ensureUserRecord(u));
    else setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      unsub = watchAuth(async (u) => {
        if (cancelled) return;
        if (u) setUser(await ensureUserRecord(u));
        else setUser(null);
        setLoading(false);
      });
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-2xl font-black text-primary-foreground">
            C
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Loading CYBERTOOL…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuthed={loadUser} />;

  return (
    <Dashboard
      user={user}
      onRoleChange={(isAdmin) => setUser({ ...user, isAdmin })}
      onSignOut={() => setUser(null)}
    />
  );
}
