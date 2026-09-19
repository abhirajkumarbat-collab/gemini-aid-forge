import { useEffect, useRef, useState } from "react";
import type { CyberResource } from "@/lib/resources";

interface Msg {
  role: "user" | "bot";
  text: string;
}

const SUGGESTIONS = [
  "How do I start learning cybersecurity?",
  "What tools are in the catalog?",
  "Explain what an APK is",
  "Safety tips for beginners",
];

function botReply(q: string, resources: CyberResource[]): string {
  const t = q.toLowerCase();
  if (/(tool|catalog|app|resource|what.*(have|got)|list)/.test(t)) {
    if (!resources.length)
      return "The catalog is empty right now — new content published by the admin appears here automatically. Check back soon!";
    const top = resources.slice(0, 5).map((r) => `• ${r.title} (${r.category})`).join("\n");
    return `Here are the latest resources in CYBERTOOL:\n${top}\n\nOpen the Catalog tab and use search or category filters to explore everything.`;
  }
  if (/(start|begin|learn|beginner|new)/.test(t)) {
    return "Great first step! A safe learning path: 1) Learn networking basics (TCP/IP, DNS). 2) Practice Linux commands in Termux or a VM. 3) Study defensive security — how attacks work so you can prevent them. 4) Practice legally on platforms built for learning. Always practice only on systems you own or have permission to test.";
  }
  if (/(apk|install)/.test(t)) {
    return "An APK is an Android app installer file. Only install APKs from sources you trust, check requested permissions before installing, and keep Play Protect enabled.";
  }
  if (/(safe|safety|legal|secure|protect)/.test(t)) {
    return "Golden rules: never test systems you don't own, use strong unique passwords with 2FA, keep your OS and apps updated, avoid unknown links/attachments, and use a VPN on public Wi-Fi. CYBERTOOL content is for legal, ethical learning only.";
  }
  if (/(termux|kali|linux|command)/.test(t)) {
    return "For Linux/Termux practice, start with basics: ls, cd, pwd, mkdir, cp, mv, rm, chmod, grep, cat. If the admin has published command guides, you'll find them in the Catalog under the Method category.";
  }
  if (/(hi|hello|hey|namaste)/.test(t)) {
    return "Hello! I'm CyberBot, your learning guide. Ask me about the catalog, getting started with cybersecurity, or safety best practices.";
  }
  return "I can help with: what's in the catalog, how to start learning cybersecurity, Termux/Linux basics, APK safety, and staying legal and secure. Try one of the suggestions below!";
}

export function CyberBot({ resources }: { resources: CyberResource[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Welcome to CYBERTOOL! I'm CyberBot 🤖 Ask me anything about the catalog or cybersecurity learning." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "bot", text: botReply(q, resources) }]);
    }, 350);
  };

  return (
    <div className="flex h-[calc(100vh-210px)] flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm">◈</div>
        <div>
          <p className="text-sm font-bold text-foreground">CyberBot Pro</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#10b981]">● Online</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  : "border border-border bg-secondary text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="whitespace-nowrap rounded-full border border-border bg-secondary px-3 py-1 text-[10px] font-semibold text-muted-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask CyberBot…"
            className="flex-1 rounded-lg border border-input bg-[#0c1119] px-3.5 py-2.5 text-sm text-foreground placeholder:text-[#566180] focus:border-primary focus:outline-none"
          />
          <button className="rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-primary-foreground">
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
