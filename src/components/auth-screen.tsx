import { useState } from "react";
import {
  signUpEmail,
  signInEmail,
  signInGoogle,
  signInGuest,
  resetPassword,
  makeRecaptcha,
  sendPhoneOtp,
} from "@/lib/firebase-auth-actions";
import type { ConfirmationResult } from "firebase/auth";

function strength(pw: string): { label: string; pct: number; cls: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { label: "Weak", pct: 25, cls: "bg-destructive" };
  if (s <= 3) return { label: "Medium", pct: 60, cls: "bg-[#f59e0b]" };
  return { label: "Strong", pct: 100, cls: "bg-[#10b981]" };
}

const inputCls =
  "w-full rounded-lg border border-input bg-[#0c1119] px-3.5 py-2.5 text-sm text-foreground placeholder:text-[#566180] focus:border-primary focus:outline-none transition-colors";

export function AuthScreen({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup" | "phone">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpResult, setOtpResult] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      onAuthed();
    } catch (e: any) {
      setError(e?.message?.replace("Firebase: ", "") ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const pw = strength(password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-3xl font-black text-primary-foreground shadow-[0_8px_30px_rgba(0,212,255,0.35)]">
            C
          </div>
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            CYBERTOOL
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Learn. Practice. Secure.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
            {(
              [
                ["signin", "Sign In"],
                ["signup", "Sign Up"],
                ["phone", "Mobile"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setNotice("");
                }}
                className={`rounded-md py-2 text-xs font-bold transition-colors ${
                  mode === m
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-3 py-2 text-xs text-[#10b981]">
              {notice}
            </div>
          )}

          {mode !== "phone" ? (
            <form
              className="space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === "signup") {
                  if (password !== confirm) {
                    setError("Passwords do not match");
                    return;
                  }
                  run(() => signUpEmail(name.trim(), email.trim(), password));
                } else {
                  run(() => signInEmail(email.trim(), password));
                }
              }}
            >
              {mode === "signup" && (
                <input
                  className={inputCls}
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <input
                className={inputCls}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <input
                  className={inputCls + " pr-16"}
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {mode === "signup" && password && (
                <div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full ${pw.cls} transition-all`}
                      style={{ width: `${pw.pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Password strength: {pw.label}
                  </p>
                </div>
              )}
              {mode === "signup" && (
                <input
                  className={inputCls}
                  type="password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create Account"
                    : "Sign In"}
              </button>
              {mode === "signin" && (
                <button
                  type="button"
                  className="w-full text-center text-xs text-primary hover:underline"
                  onClick={() => {
                    if (!email.trim()) {
                      setError("Enter your email first");
                      return;
                    }
                    setBusy(true);
                    resetPassword(email.trim())
                      .then(() => setNotice("Password reset email sent. Check your inbox."))
                      .catch((e: any) => setError(e?.message ?? "Failed"))
                      .finally(() => setBusy(false));
                  }}
                >
                  Forgot password?
                </button>
              )}
            </form>
          ) : (
            <div className="space-y-3.5">
              <input
                className={inputCls}
                type="tel"
                placeholder="Phone number (+91 …)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {otpResult && (
                <input
                  className={inputCls}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              )}
              <div id="recaptcha-container" />
              <button
                disabled={busy}
                onClick={() => {
                  if (!otpResult) {
                    run(async () => {
                      const v = makeRecaptcha("recaptcha-container");
                      const r = await sendPhoneOtp(phone.trim(), v);
                      setOtpResult(r);
                      setNotice("OTP sent to your phone");
                    });
                  } else {
                    run(() => otpResult.confirm(otp.trim()));
                  }
                }}
                className="w-full rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Please wait…" : otpResult ? "Verify OTP" : "Send OTP"}
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              or continue with
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={busy}
              onClick={() => run(signInGoogle)}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-2.5 text-xs font-bold text-foreground hover:border-primary/50 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              disabled={busy}
              onClick={() => run(signInGuest)}
              className="rounded-lg border border-border bg-secondary py-2.5 text-xs font-bold text-foreground hover:border-primary/50 disabled:opacity-50"
            >
              Guest Mode
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          By continuing you agree to use CYBERTOOL for legal, ethical learning only.
        </p>
      </div>
    </div>
  );
}
