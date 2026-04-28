"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function LoginScreen({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

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

  async function verifyOtp(token: string) {
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

  function handleCodeChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 8);
    setCode(digits);
    setError("");
    if (digits.length === 8) verifyOtp(digits);
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
        className="glass rounded-3xl p-7 sm:p-10 max-w-sm w-full"
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
                We&apos;ll email you an 8-digit code. No password needed.
              </p>
            </motion.div>
          ) : (
            <motion.div key="code" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <button
                onClick={() => { setStep("email"); setCode(""); setError(""); }}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {email}
              </button>

              <p className="text-sm font-medium mb-1">Enter your 8-digit code</p>
              <p className="text-xs text-muted mb-4">Check your inbox — expires in 10 minutes.</p>

              {/* Single OTP input */}
              <div className="relative mb-5">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={8}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/60 dark:bg-white/5 rounded-2xl px-4 py-4 outline-none focus:ring-2 ring-brand-500/50 text-center text-2xl font-bold tracking-[0.4em] transition-all placeholder:text-muted/40 placeholder:tracking-[0.4em]"
                />
                {loadingCode && (
                  <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/10 backdrop-blur-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                  </div>
                )}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i < code.length ? 1.2 : 1 }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < code.length ? "bg-brand-500" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>

              {error && <p className="text-xs text-pink-500 mb-3 text-center">{error}</p>}

              <button
                onClick={() => verifyOtp(code)}
                disabled={code.length < 8 || loadingCode}
                className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand-600 via-pink-500 to-amber-400 shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Verify & sign in
              </button>

              <button
                onClick={() => { setCode(""); sendOtp(); }}
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
