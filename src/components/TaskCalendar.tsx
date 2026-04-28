"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useState } from "react";
import {
  addDays, addMonths, addWeeks,
  eachDayOfInterval,
  endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, isToday,
  startOfMonth, startOfWeek, subMonths, subWeeks, subDays,
} from "date-fns";
import type { Task } from "@/lib/types";
import { getCramRisk } from "@/lib/priority";
import { cn } from "@/lib/utils";

type Mode = "day" | "week" | "month";

const riskChip = {
  calm:    "bg-teal-400/25 text-teal-700 dark:text-teal-300 border border-teal-400/30",
  warming: "bg-amber-400/25 text-amber-700 dark:text-amber-300 border border-amber-400/30",
  danger:  "bg-pink-500/25 text-pink-700 dark:text-pink-300 border border-pink-500/30",
};

const riskDot = {
  calm:    "bg-teal-400",
  warming: "bg-amber-400",
  danger:  "bg-pink-500",
};

function tasksOnDay(tasks: Task[], day: Date) {
  return tasks.filter((t) => isSameDay(new Date(t.deadline), day));
}

export function TaskCalendar({ tasks }: { tasks: Task[] }) {
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState(new Date());
  const [dir, setDir] = useState(1);

  function navigate(forward: boolean) {
    setDir(forward ? 1 : -1);
    setAnchor((prev) => {
      if (mode === "day")   return forward ? addDays(prev, 1)    : subDays(prev, 1);
      if (mode === "week")  return forward ? addWeeks(prev, 1)   : subWeeks(prev, 1);
      return                      forward ? addMonths(prev, 1)   : subMonths(prev, 1);
    });
  }

  function navLabel() {
    if (mode === "day")   return format(anchor, "EEEE, MMM d");
    if (mode === "week") {
      const s = startOfWeek(anchor, { weekStartsOn: 1 });
      const e = endOfWeek(anchor, { weekStartsOn: 1 });
      return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
    }
    return format(anchor, "MMMM yyyy");
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass rounded-3xl p-6 sm:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted" />
          <h2 className="font-bold text-lg">{navLabel()}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex bg-white/30 dark:bg-white/5 rounded-xl p-0.5 text-xs font-semibold">
            {(["day", "week", "month"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 rounded-[10px] capitalize transition-all",
                  mode === m
                    ? "bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow"
                    : "text-muted hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Prev / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(false)}
              className="p-1.5 rounded-xl hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(true)}
              className="p-1.5 rounded-xl hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Views */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={`${mode}-${anchor.toISOString()}`}
          custom={dir}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 24 }),
            center: { opacity: 1, x: 0 },
            exit:  (d: number) => ({ opacity: 0, x: d * -24 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {mode === "day"   && <DayView   tasks={tasks} day={anchor} />}
          {mode === "week"  && <WeekView  tasks={tasks} anchor={anchor} />}
          {mode === "month" && <MonthView tasks={tasks} anchor={anchor} onDayClick={setAnchor} />}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

/* ── Day view ─────────────────────────────────────────────── */
function DayView({ tasks, day }: { tasks: Task[]; day: Date }) {
  const dayTasks = tasksOnDay(tasks, day);

  if (dayTasks.length === 0) {
    return (
      <div className="py-10 text-center text-muted text-sm">
        No tasks due {isToday(day) ? "today" : "on this day"} 🎉
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dayTasks.map((t) => (
        <TaskChip key={t.id} task={t} showTime />
      ))}
    </div>
  );
}

/* ── Week view ────────────────────────────────────────────── */
function WeekView({ tasks, anchor }: { tasks: Task[]; anchor: Date }) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const days  = eachDayOfInterval({ start, end: addDays(start, 6) });

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => {
        const dayTasks = tasksOnDay(tasks, day);
        const today    = isToday(day);

        return (
          <div key={day.toISOString()} className="min-h-[60px] sm:min-h-[90px]">
            {/* Day header */}
            <div className="text-center mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted">
                {format(day, "EEE")}
              </p>
              <div className={cn(
                "w-7 h-7 rounded-full grid place-items-center mx-auto text-xs font-bold",
                today ? "bg-gradient-to-br from-brand-500 to-pink-500 text-white" : "text-foreground",
              )}>
                {format(day, "d")}
              </div>
            </div>

            {/* Task dots (mobile) / chips (sm+) */}
            <div className="space-y-1">
              {/* sm+: text chips */}
              <div className="hidden sm:block space-y-1">
                {dayTasks.slice(0, 3).map((t) => {
                  const risk = getCramRisk(t).level;
                  return (
                    <div
                      key={t.id}
                      title={t.title}
                      className={cn(
                        "rounded-lg px-1.5 py-0.5 text-[10px] font-medium leading-tight truncate",
                        riskChip[risk],
                      )}
                    >
                      {t.emoji} {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-muted pl-1">+{dayTasks.length - 3}</p>
                )}
              </div>
              {/* mobile: colored dots only */}
              <div className="flex sm:hidden flex-wrap gap-0.5 justify-center">
                {dayTasks.slice(0, 4).map((t) => (
                  <span
                    key={t.id}
                    title={t.title}
                    className={cn("w-2 h-2 rounded-full", riskDot[getCramRisk(t).level])}
                  />
                ))}
                {dayTasks.length > 4 && (
                  <span className="w-2 h-2 rounded-full bg-muted/40" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Month view ───────────────────────────────────────────── */
function MonthView({
  tasks,
  anchor,
  onDayClick,
}: {
  tasks: Task[];
  anchor: Date;
  onDayClick: (d: Date) => void;
}) {
  const monthStart  = startOfMonth(anchor);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd      = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days        = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
          <p key={d} className="text-[10px] uppercase tracking-wider text-muted text-center py-1">{d}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const dayTasks    = tasksOnDay(tasks, day);
          const inMonth     = isSameMonth(day, anchor);
          const today       = isToday(day);
          const hasDanger   = dayTasks.some((t) => getCramRisk(t).level === "danger");
          const hasWarming  = !hasDanger && dayTasks.some((t) => getCramRisk(t).level === "warming");

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "aspect-square rounded-xl flex flex-col items-center pt-1 gap-0.5 transition-all hover:bg-white/20 dark:hover:bg-white/5",
                !inMonth && "opacity-30",
                today && "ring-2 ring-brand-500/60",
              )}
            >
              <span className={cn(
                "text-xs font-semibold leading-none w-6 h-6 grid place-items-center rounded-full",
                today && "bg-gradient-to-br from-brand-500 to-pink-500 text-white",
              )}>
                {format(day, "d")}
              </span>

              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center px-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className={cn("w-1.5 h-1.5 rounded-full", riskDot[getCramRisk(t).level])}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-muted/40" />
                  )}
                </div>
              )}

              {(hasDanger || hasWarming) && dayTasks.length > 0 && (
                <span className="text-[9px] leading-none">
                  {hasDanger ? "🚨" : "⚡"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Task chip ────────────────────────────────────────────── */
function TaskChip({ task, showTime }: { task: Task; showTime?: boolean }) {
  const risk = getCramRisk(task).level;
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
      riskChip[risk],
      task.status === "done" && "opacity-50 line-through",
    )}>
      <span className="text-base shrink-0">{task.emoji ?? "✨"}</span>
      <span className="flex-1 truncate">{task.title}</span>
      {showTime && (
        <span className="text-xs opacity-70 shrink-0">
          {format(new Date(task.deadline), "h:mm a")}
        </span>
      )}
    </div>
  );
}
