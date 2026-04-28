"use client";

import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Flame } from "lucide-react";
import type { Task } from "@/lib/types";
import { academicHealth, getCramRisk } from "@/lib/priority";

const statusStyle = {
  on_track: {
    icon: TrendingUp,
    gradient: "from-teal-400 to-brand-500",
    blurb: "Pace is good. Keep showing up.",
  },
  at_risk: {
    icon: AlertTriangle,
    gradient: "from-amber-400 to-pink-500",
    blurb: "A couple of items want attention soon.",
  },
  overloaded: {
    icon: Flame,
    gradient: "from-pink-500 to-brand-600",
    blurb: "Triage time — pick the one thing that moves the most.",
  },
} as const;

export function AcademicHealth({ tasks }: { tasks: Task[] }) {
  const health = academicHealth(tasks);
  const Icon = statusStyle[health.status].icon;
  const active = tasks.filter((t) => t.status !== "done");
  const danger = active.filter((t) => getCramRisk(t).level === "danger").length;
  const warming = active.filter((t) => getCramRisk(t).level === "warming").length;
  const calm = active.length - danger - warming;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass rounded-3xl p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Academic health</p>
          <div className="flex items-center gap-3 mt-1">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statusStyle[health.status].gradient} grid place-items-center text-white shadow-lg`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-tight">{health.label}</h2>
              <p className="text-sm text-muted">{statusStyle[health.status].blurb}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Stat label="calm" value={calm} tint="bg-teal-400/15 text-teal-700 dark:text-teal-300" />
          <Stat label="warming" value={warming} tint="bg-amber-400/20 text-amber-700 dark:text-amber-300" />
          <Stat label="urgent" value={danger} tint="bg-pink-500/20 text-pink-700 dark:text-pink-300" />
        </div>
      </div>

      <div className="mt-5 h-2 rounded-full bg-white/30 dark:bg-white/5 overflow-hidden flex">
        {active.length === 0 ? (
          <motion.div
            initial={{ width: 0 }} animate={{ width: "100%" }}
            className="h-full bg-gradient-to-r from-teal-400 to-brand-500"
          />
        ) : (
          <>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(calm / active.length) * 100}%` }} transition={{ duration: 0.6 }} className="h-full bg-teal-400" />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(warming / active.length) * 100}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="h-full bg-amber-400" />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(danger / active.length) * 100}%` }} transition={{ duration: 0.6, delay: 0.2 }} className="h-full bg-pink-500" />
          </>
        )}
      </div>
    </motion.section>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className={`rounded-xl px-3 py-2 text-center min-w-[64px] ${tint}`}>
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
