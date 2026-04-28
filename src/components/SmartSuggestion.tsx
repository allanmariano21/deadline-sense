"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Battery, BatteryFull, BatteryLow, Clock, Wand2, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { EnergyLevel, Task } from "@/lib/types";
import { suggestNextTask } from "@/lib/priority";
import { formatDuration } from "@/lib/utils";

const energyOptions: { value: EnergyLevel; label: string; icon: React.ComponentType<{ className?: string }>; tint: string }[] = [
  { value: "tired", label: "Tired", icon: BatteryLow, tint: "from-amber-400/20 to-pink-500/10" },
  { value: "okay", label: "Okay", icon: Battery, tint: "from-teal-400/20 to-brand-500/10" },
  { value: "focused", label: "Focused", icon: BatteryFull, tint: "from-brand-500/30 to-pink-500/20" },
];

const timePresets = [15, 25, 45, 90];

export function SmartSuggestion({
  tasks,
  onStartTask,
}: {
  tasks: Task[];
  onStartTask: (taskId: string) => void;
}) {
  const [energy, setEnergy] = useState<EnergyLevel>("okay");
  const [minutes, setMinutes] = useState(25);
  const [revealKey, setRevealKey] = useState(0);

  const suggestion = useMemo(
    () => suggestNextTask(tasks, { availableMinutes: minutes, energy }),
    [tasks, minutes, energy],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-brand-500/30 to-pink-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-teal-400/20 to-brand-500/20 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Wand2 className="w-4 h-4" />
          What should I do right now?
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mt-1">Tell me your vibe.</h2>

        <div className="flex flex-col gap-5 mt-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Time available
            </p>
            <div className="flex flex-wrap gap-2">
              {timePresets.map((m) => (
                <button
                  key={m}
                  onClick={() => { setMinutes(m); setRevealKey((k) => k + 1); }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    minutes === m
                      ? "bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-lg shadow-brand-500/30 scale-105"
                      : "bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  {formatDuration(m)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted mb-2">Energy level</p>
            <div className="grid grid-cols-3 gap-2">
              {energyOptions.map(({ value, label, icon: Icon, tint }) => (
                <button
                  key={value}
                  onClick={() => { setEnergy(value); setRevealKey((k) => k + 1); }}
                  className={`py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    energy === value
                      ? `bg-gradient-to-br ${tint} ring-2 ring-brand-500/50 scale-105`
                      : "bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 min-h-[112px]">
          <AnimatePresence mode="wait">
            {suggestion ? (
              <motion.div
                key={`${suggestion.id}-${revealKey}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="rounded-2xl p-5 bg-gradient-to-br from-brand-600 via-brand-500 to-pink-500 text-white shadow-xl shadow-brand-500/40"
              >
                <p className="text-sm/none opacity-80">Try this next</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1.5">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold flex items-center gap-2 flex-wrap">
                      <span className="text-2xl shrink-0">{suggestion.emoji ?? "✨"}</span>
                      <span className="break-words">{suggestion.title}</span>
                    </h3>
                    <p className="text-sm opacity-90 mt-1">
                      {suggestion.course ? `${suggestion.course} · ` : ""}
                      {formatDuration(Math.max(0, suggestion.effort_minutes - suggestion.progress_minutes))} of focused work fits this slot.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onStartTask(suggestion.id)}
                    className="self-start sm:self-auto shrink-0 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2.5 font-semibold flex items-center gap-1.5 backdrop-blur"
                  >
                    Start <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted text-sm"
              >
                Nothing matches that combo right now — try more time or higher energy.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
