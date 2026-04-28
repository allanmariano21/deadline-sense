"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function Header({ healthLabel }: { healthLabel: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Burning the midnight oil" :
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
    hour < 22 ? "Good evening" : "Late night grind";

  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 4 }}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 via-pink-500 to-teal-400 grid place-items-center shadow-lg shadow-brand-500/30"
        >
          <Sparkles className="w-6 h-6 text-white" strokeWidth={2.4} />
        </motion.div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{greeting}</p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            <span className="gradient-text">Deadline Sense</span>
          </h1>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="glass rounded-2xl px-4 py-2 text-sm font-medium flex items-center gap-2"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400" />
        </span>
        <span className="text-muted">Status:</span>
        <span className="font-semibold">{healthLabel}</span>
      </motion.div>
    </header>
  );
}
