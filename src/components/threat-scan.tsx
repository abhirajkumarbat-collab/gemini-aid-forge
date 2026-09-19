import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeThreat } from "@/lib/threat.functions";

export function ThreatScan() {
  const run = useServerFn(analyzeThreat);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (file: File) => {
    if (file.size > 4_000_000) {
      setError("That image is too large. Use one under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const scan = async () => {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const r = await run({ data: { text, imageDataUrl: image ?? undefined } });
      setResult(r.result);
    } catch (e: any) {
      setError(e?.message ?? "The scan failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold text-foreground">Scam & Threat Scanner</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Paste a suspicious message or add a screenshot. You'll get a risk verdict and safe next
          steps.
        </p>

        <textarea
          className="mt-3 min-h-28 w-full rounded-lg border border-input bg-[#0c1119] px-3.5 py-2.5 text-sm text-foreground placeholder:text-[#566180] focus:border-primary focus:outline-none"
          placeholder="Paste the SMS, WhatsApp text, email or link here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
          }}
        />

        {image && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-secondary p-2">
            <img src={image} alt="" className="h-14 w-14 rounded-lg object-cover" />
            <p className="flex-1 text-[11px] text-muted-foreground">Screenshot attached</p>
            <button
              onClick={() => setImage(null)}
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive"
            >
              Remove
            </button>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground"
          >
            📷 Screenshot
          </button>
          <button
            onClick={scan}
            disabled={busy || (!text.trim() && !image)}
            className="flex-1 rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Scanning…" : "Scan for threats"}
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      {busy && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="mt-2 h-3 w-full animate-pulse rounded bg-secondary" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-secondary" />
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="whitespace-pre-line text-xs leading-relaxed text-foreground">{result}</p>
        </div>
      )}
    </div>
  );
}
