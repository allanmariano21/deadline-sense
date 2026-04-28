"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Mail, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AuthGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function LoginScreen({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState("");

  async function sendMagicLink() {
    if (!email.trim()) return;
    setState("loading");
    setError("");

    const sb = getSupabaseBrowser();
    if (!sb) { setError("Supabase not configured."); setState("idle"); return; }

    const { error: err } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    if (err) { setError(err.message); setState("idle"); return; }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-10 max-w-sm w-full text-center"
        >
          <CheckCircle className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted mt-2 text-sm">
            We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
          </p>
          <button
            onClick={() => setState("idle")}
            className="mt-6 text-sm text-brand-500 hover:underline"
          >
            Use a different email
          </button>
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 via-pink-500 to-teal-400 grid place-items-center shadow-lg shadow-brand-500/30">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              <span className="gradient-text">Deadline Sense</span>
            </h1>
            <p className="text-xs text-muted">Sign in to sync your tasks</p>
          </div>
        </div>

        <label className="block mb-3">
          <span className="text-xs uppercase tracking-wider text-muted block mb-1.5">
            <Mail className="w-3.5 h-3.5 inline mr-1" />Email
          </span>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
            placeholder="you@example.com"
            className="w-full bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-brand-500/40"
          />
        </label>

        {error && <p className="text-xs text-pink-500 mb-3">{error}</p>}

        <button
          onClick={sendMagicLink}
          disabled={!email.trim() || state === "loading"}
          className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand-600 via-pink-500 to-amber-400 shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <AnimatePresence mode="wait">
            {state === "loading" ? (
              <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Sending…
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Send magic link ✨
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <p className="text-center text-xs text-muted mt-4">
          No password needed — just click the link in your email.
        </p>
      </motion.div>
    </div>
  );
}
