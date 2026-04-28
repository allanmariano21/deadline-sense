"use client";

import { motion } from "framer-motion";
import { Check, Flame, Clock3, Gauge } from "lucide-react";
import type { Task } from "@/lib/types";
import { getCramRisk, getPriorityBreakdown } from "@/lib/priority";
import { formatDuration, formatRelative, cn } from "@/lib/utils";

const riskStyles = {
  calm: { ring: "ring-teal-400/30", chip: "bg-teal-400/15 text-teal-700 dark:text-teal-300", emoji: "🌿" },
  warming: { ring: "ring-amber-400/40", chip: "bg-amber-400/20 text-amber-700 dark:text-amber-300", emoji: "⚡" },
  danger: { ring: "ring-pink-500/50", chip: "bg-pink-500/20 text-pink-700 dark:text-pink-300", emoji: "🚨" },
};

export function TaskCard({
  task,
  onComplete,
  onStart,
  rank,
}: {
  task: Task;
  onComplete: (id: string) => void;
  onStart: (id: string) => void;
  rank: number;
}) {
  const cram = getCramRisk(task);
  const breakdown = getPriorityBreakdown(task);
  const remaining = Math.max(0, task.effort_minutes - task.progress_minutes);
  const progressPct = task.effort_minutes
    ? Math.min(100, (task.progress_minutes / task.effort_minutes) * 100)
    : 0;
  const riskStyle = riskStyles[cram.level];
  const isDone = task.status === "done";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn(
        "glass rounded-2xl p-5 ring-1 transition-shadow",
        isDone ? "ring-white/10 opacity-60" : `ring-1 ${riskStyle.ring} hover:shadow-xl hover:shadow-brand-500/10`,
      )}
    >
      <div className="flex items-start gap-3">
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.06 }}
          onClick={() => onComplete(task.id)}
          aria-label={isDone ? "Mark as not done" : "Mark as done"}
          className={cn(
            "shrink-0 mt-0.5 w-7 h-7 rounded-full grid place-items-center border-2 transition-colors",
            isDone
              ? "bg-gradient-to-br from-teal-400 to-brand-500 border-transparent text-white"
              : "border-brand-500/40 hover:border-brand-500 hover:bg-brand-500/10",
          )}
        >
          {isDone && <Check className="w-4 h-4" strokeWidth={3} />}
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={cn(
                "font-semibold text-base sm:text-lg leading-tight flex items-center gap-2",
                isDone && "line-through",
              )}>
                <span className="text-xl shrink-0">{task.emoji ?? "✨"}</span>
                <span className="truncate">{task.title}</span>
              </h3>
              {task.course && (
                <p className="text-xs uppercase tracking-wider text-muted mt-0.5">
                  {task.course}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs font-mono text-muted">#{rank}</span>
          </div>

          {task.notes && (
            <p className="text-sm text-muted mt-2 line-clamp-2">{task.notes}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/40 dark:bg-white/5 px-2.5 py-1">
              <Clock3 className="w-3.5 h-3.5" />
              {formatRelative(task.deadline)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/40 dark:bg-white/5 px-2.5 py-1">
              <Gauge className="w-3.5 h-3.5" />
              {formatDuration(remaining)} left
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/40 dark:bg-white/5 px-2.5 py-1">
              <Flame className="w-3.5 h-3.5" />
              difficulty {task.difficulty}/5
            </span>
            {!isDone && (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium", riskStyle.chip)}>
                {riskStyle.emoji} {cram.message}
              </span>
            )}
          </div>

          {progressPct > 0 && (
            <div className="mt-3 h-1.5 rounded-full bg-white/30 dark:bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-brand-500 via-pink-500 to-teal-400"
              />
            </div>
          )}

          {!isDone && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted">
                priority <span className="font-semibold text-foreground">{Math.round(breakdown.score * 100)}</span>
              </span>
              <button
                onClick={() => onStart(task.id)}
                className="text-xs font-semibold text-brand-600 hover:text-pink-500 transition-colors"
              >
                Log 15 min →
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
