"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, CalendarDays, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  addMonths, subMonths,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  format, isSameDay, isToday, isSameMonth, isBefore, startOfToday,
} from "date-fns";
import type { Difficulty, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const emojiPalette = ["📐", "📚", "💻", "🎤", "🧬", "🧪", "🎨", "🧠", "✏️", "🎧"];

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setSeconds(0, 0);
  // Format for datetime-local: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}

function dueLabel(deadlineLocal: string): string {
  if (!deadlineLocal) return "";
  const diff = new Date(deadlineLocal).getTime() - Date.now();
  if (diff <= 0) return "Already past due";
  const hours = diff / 3_600_000;
  if (hours < 24) return `Due in ${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours % 24);
  return remHours > 0 ? `Due in ${days}d ${remHours}h` : `Due in ${days}d`;
}

export function AddTaskDialog({ onCreate }: { onCreate: (task: Task) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [effort, setEffort] = useState(60);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [emoji, setEmoji] = useState("📚");

  function reset() {
    setTitle(""); setCourse(""); setNotes("");
    setDeadline(defaultDeadline()); setEffort(60); setDifficulty(3); setEmoji("📚");
  }

  function submit() {
    if (!title.trim() || !deadline) return;
    onCreate({
      id: crypto.randomUUID(),
      title: title.trim(),
      course: course.trim() || undefined,
      notes: notes.trim() || undefined,
      deadline: new Date(deadline).toISOString(),
      effort_minutes: effort,
      difficulty,
      status: "todo",
      progress_minutes: 0,
      emoji,
      created_at: new Date().toISOString(),
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, rotate: 4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 via-pink-500 to-amber-400 shadow-2xl shadow-brand-500/40 grid place-items-center text-white"
        aria-label="Add task"
      >
        <Plus className="w-6 h-6" strokeWidth={2.6} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">New task</h2>
                  <p className="text-sm text-muted">A few details and we&apos;ll prioritize it for you.</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 rounded-lg hover:bg-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Field label="Title">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Calculus problem set §4.3"
                  className="w-full bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-brand-500/40"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Course">
                  <input
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="Math 101"
                    className="w-full bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-brand-500/40"
                  />
                </Field>
                <Field label="Emoji">
                  <div className="flex flex-wrap gap-1.5">
                    {emojiPalette.map((e) => (
                      <button
                        key={e}
                        onClick={() => setEmoji(e)}
                        className={`text-lg w-8 h-8 rounded-lg transition-all ${
                          emoji === e ? "bg-gradient-to-br from-brand-500 to-pink-500 scale-110" : "bg-white/40 dark:bg-white/5 hover:bg-white/70"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="What's the first step?"
                  className="w-full bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-brand-500/40 resize-none"
                />
              </Field>

              {/* Date picker */}
              <DeadlinePicker value={deadline} onChange={setDeadline} />

              <div className="grid grid-cols-2 gap-3">
                <Field label={`Effort: ${effort < 60 ? `${effort} min` : `${(effort / 60).toFixed(effort % 60 ? 1 : 0)}h`}`}>
                  <input
                    type="range"
                    min={15}
                    max={480}
                    step={15}
                    value={effort}
                    onChange={(e) => setEffort(Number(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </Field>
                <Field label={`Difficulty: ${difficulty}/5`}>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d as Difficulty)}
                        className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all ${
                          difficulty >= d
                            ? "bg-gradient-to-r from-brand-500 to-pink-500 text-white"
                            : "bg-white/40 dark:bg-white/5"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <button
                onClick={submit}
                disabled={!title.trim() || !deadline || dueLabel(deadline).startsWith("Already")}
                className="mt-6 w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand-600 via-pink-500 to-amber-400 shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-brand-500/40 transition-shadow"
              >
                Add to my list
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function DeadlinePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);

  function preset(days: number, hour = 23, minute = 59) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    onChange(`${format(d, "yyyy-MM-dd")}T${pad(hour)}:${pad(minute)}`);
  }

  const presets = [
    { label: "Tonight",   action: () => preset(0, 23, 59) },
    { label: "Tomorrow",  action: () => preset(1, 23, 59) },
    { label: "In 3 days", action: () => preset(3, 23, 59) },
    { label: "Next week", action: () => preset(7, 23, 59) },
  ];

  const label  = dueLabel(value);
  const isPast = label.startsWith("Already");

  return (
    <div className="mb-3">
      <span className="text-xs uppercase tracking-wider text-muted block mb-2">Deadline</span>

      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={p.action}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/40 dark:bg-white/5 hover:bg-brand-500/20 hover:text-brand-500 transition-all"
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/40 dark:bg-white/5 hover:bg-pink-500/20 hover:text-pink-500 transition-all flex items-center gap-1.5"
        >
          <CalendarDays className="w-3.5 h-3.5" /> Pick date
        </button>
      </div>

      {value && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
            isPast ? "bg-pink-500/15 text-pink-500" : "bg-brand-500/15 text-brand-500"
          }`}
          onClick={() => setShowPicker(true)}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            {new Date(value).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
              hour: "numeric", minute: "2-digit",
            })}
          </span>
          <span className="font-semibold text-xs opacity-75">{label}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {showPicker && (
          <CustomDatePicker
            value={value}
            onChange={onChange}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomDatePicker({ value, onChange, onClose }: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const parsed   = value ? new Date(value) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(23, 59, 0, 0); return d; })();
  const [viewMonth,    setViewMonth]    = useState(startOfMonth(parsed));
  const [selectedDay,  setSelectedDay]  = useState<Date>(parsed);
  const [hour24,       setHour24]       = useState(parsed.getHours());
  const [minute,       setMinute]       = useState(Math.round(parsed.getMinutes() / 5) * 5 % 60);

  const days        = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
    end:   endOfWeek(endOfMonth(viewMonth),     { weekStartsOn: 1 }),
  });
  const displayHour = hour24 % 12 || 12;
  const isAm        = hour24 < 12;

  function confirm() {
    const d = new Date(selectedDay);
    d.setHours(hour24, minute, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    onChange(`${format(d, "yyyy-MM-dd")}T${pad(hour24)}:${pad(minute)}`);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-3xl p-5 w-full max-w-sm"
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm">{format(viewMonth, "MMMM yyyy")}</span>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-xl hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <p key={i} className="text-[10px] uppercase tracking-wider text-muted text-center py-1">{d}</p>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 mb-4">
          {days.map((day) => {
            const inMonth    = isSameMonth(day, viewMonth);
            const isSelected = isSameDay(day, selectedDay);
            const today      = isToday(day);
            const past       = isBefore(day, startOfToday());

            return (
              <button
                key={day.toISOString()}
                onClick={() => { if (!past) setSelectedDay(day); }}
                disabled={past}
                className={cn(
                  "aspect-square rounded-xl text-xs font-semibold transition-all",
                  !inMonth && "opacity-30",
                  past && "opacity-20 cursor-not-allowed",
                  isSelected && "bg-gradient-to-br from-brand-500 to-pink-500 text-white shadow-md shadow-brand-500/30",
                  !isSelected && today && "ring-2 ring-brand-500/60",
                  !isSelected && !past && inMonth && "hover:bg-white/30 dark:hover:bg-white/10",
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {/* Time picker */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white/20 dark:bg-white/5 rounded-2xl mb-4">
          <span className="text-xs text-muted uppercase tracking-wider mr-auto">Time</span>

          {/* Hour */}
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => setHour24((h) => (h + 1) % 24)} className="p-0.5 rounded-lg hover:bg-white/30 transition-colors">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-xl w-9 text-center tabular-nums">
              {String(displayHour).padStart(2, "0")}
            </span>
            <button onClick={() => setHour24((h) => (h - 1 + 24) % 24)} className="p-0.5 rounded-lg hover:bg-white/30 transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="font-bold text-xl text-muted">:</span>

          {/* Minute */}
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => setMinute((m) => (m + 5) % 60)} className="p-0.5 rounded-lg hover:bg-white/30 transition-colors">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-xl w-9 text-center tabular-nums">
              {String(minute).padStart(2, "0")}
            </span>
            <button onClick={() => setMinute((m) => (m - 5 + 60) % 60)} className="p-0.5 rounded-lg hover:bg-white/30 transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AM / PM */}
          <div className="flex flex-col gap-1.5 ml-1">
            <button
              onClick={() => setHour24((h) => h < 12 ? h : h - 12)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                isAm
                  ? "bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow shadow-brand-500/30"
                  : "bg-white/20 dark:bg-white/5 text-muted",
              )}
            >AM</button>
            <button
              onClick={() => setHour24((h) => h >= 12 ? h : h + 12)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                !isAm
                  ? "bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow shadow-brand-500/30"
                  : "bg-white/20 dark:bg-white/5 text-muted",
              )}
            >PM</button>
          </div>
        </div>

        {/* Confirm */}
        <button
          onClick={confirm}
          className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand-600 via-pink-500 to-amber-400 shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-shadow"
        >
          Set deadline ✨
        </button>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="text-xs uppercase tracking-wider text-muted block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
