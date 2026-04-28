"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { Difficulty, Task } from "@/lib/types";

const emojiPalette = ["📐", "📚", "💻", "🎤", "🧬", "🧪", "🎨", "🧠", "✏️", "🎧"];

export function AddTaskDialog({
  onCreate,
}: {
  onCreate: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [notes, setNotes] = useState("");
  const [hours, setHours] = useState(24);
  const [effort, setEffort] = useState(60);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [emoji, setEmoji] = useState("📚");

  function reset() {
    setTitle(""); setCourse(""); setNotes("");
    setHours(24); setEffort(60); setDifficulty(3); setEmoji("📚");
  }

  function submit() {
    if (!title.trim()) return;
    onCreate({
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `t-${Date.now()}`,
      title: title.trim(),
      course: course.trim() || undefined,
      notes: notes.trim() || undefined,
      deadline: new Date(Date.now() + hours * 3_600_000).toISOString(),
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

              <Field label={`Due in ${hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`}`}>
                <input
                  type="range"
                  min={1}
                  max={336}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </Field>

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
                disabled={!title.trim()}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="text-xs uppercase tracking-wider text-muted block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
