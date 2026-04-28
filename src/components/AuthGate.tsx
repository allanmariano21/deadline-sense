"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import type { AuthResponse } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function LoginScreen({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState(["", "", "", "", "", "", "", ""]);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function sendOtp() {
    if (!email.trim()) return;
    setLoadingEmail(true);
    setError("");
    const sb = getSupabaseBrowser();
    if (!sb) { setError("Supabase not configured."); setLoadingEmail(false); return; }

    const { error: err } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoadingEmail(false);
    if (err) { setError(err.message); return; }
    setStep("code");
  }

  async function verifyOtp() {
    const token = code.join("");
    if (token.length < 8) return;
    setLoadingCode(true);
    setError("");
    const sb = getSupabaseBrowser();
    if (!sb) { setError("Supabase not configured."); setLoadingCode(false); return; }

    const { error: err } = await sb.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });

    setLoadingCode(false);
    if (err) { setError(err.message); return; }
    setVerified(true);
    setTimeout(onDone, 800);
  }

  function handleCodeInput(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    setError("");
    if (digit && i < 7) inputRefs.current[i + 1]?.focus();
    if (next.every(Boolean)) {
      // auto-submit when all 6 filled
      const sb = getSupabaseBrowser();
      if (!sb) return;
      setLoadingCode(true);
      sb.auth.verifyOtp({ email: email.trim(), token: next.join(""), type: "email" })
        .then((result: AuthResponse) => {
          setLoadingCode(false);
          if (result.error) { setError(result.error.message); return; }
          setVerified(true);
          setTimeout(onDone, 800);
        });
    }
  }

  function handleCodeKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: 8 }, (_, i) => pasted[i] ?? "");
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  if (verified) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-10 max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <CheckCircle className="w-14 h-14 text-teal-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold">You&apos;re in! ✨</h2>
          <p className="text-muted text-sm mt-2">Loading your tasks…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 sm:p-10 max-w-sm w-full"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 via-pink-500 to-teal-400 grid place-items-center shadow-lg shadow-brand-500/30">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">
              <span className="gradient-text">Deadline Sense</span>
            </h1>
            <p className="text-xs text-muted">Sign in to sync your tasks</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -12 }}>
              <label className="block mb-4">
                <span className="text-xs uppercase tracking-wider text-muted flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  placeholder="you@example.com"
                  className="w-full bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-brand-500/40"
                />
              </label>

              {error && <p className="text-xs text-pink-500 mb-3">{error}</p>}

              <button
                onClick={sendOtp}
                disabled={!email.trim() || loadingEmail}
                className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand-600 via-pink-500 to-amber-400 shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingEmail
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : "Send code ✨"}
              </button>

              <p className="text-center text-xs text-muted mt-4">
                We&apos;ll email you a 6-digit code. No password needed.
              </p>
            </motion.div>
          ) : (
            <motion.div key="code" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <button
                onClick={() => { setStep("email"); setCode(["","","","","",""]); setError(""); }}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {email}
              </button>

              <p className="text-sm font-medium mb-1">Enter your 6-digit code</p>
              <p className="text-xs text-muted mb-5">Check your inbox — it expires in 10 minutes.</p>

              {/* OTP boxes */}
              <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={i === 0}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="w-11 h-13 text-center text-xl font-bold bg-white/60 dark:bg-white/5 rounded-xl outline-none focus:ring-2 ring-brand-500/50 transition-all py-3"
                  />
                ))}
              </div>

              {error && <p className="text-xs text-pink-500 mb-3 text-center">{error}</p>}

              <button
                onClick={verifyOtp}
                disabled={code.some((d) => !d) || loadingCode}
                className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand-600 via-pink-500 to-amber-400 shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingCode
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                  : "Verify & sign in"}
              </button>

              <button
                onClick={() => { setCode(["","","","","",""]); sendOtp(); }}
                className="w-full text-center text-xs text-muted hover:text-brand-500 mt-3 transition-colors"
              >
                Resend code
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
