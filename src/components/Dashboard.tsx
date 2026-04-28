"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import type { Task } from "@/lib/types";
import { sortByPriority } from "@/lib/priority";
import { sampleTasks } from "@/lib/sample-tasks";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Header } from "./Header";
import { SmartSuggestion } from "./SmartSuggestion";
import { AcademicHealth } from "./AcademicHealth";
import { TaskCard } from "./TaskCard";
import { AddTaskDialog } from "./AddTaskDialog";
import { academicHealth } from "@/lib/priority";

const STORAGE_KEY = "deadline-sense.tasks.v1";

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage so the demo persists between refreshes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Task[];
        if (Array.isArray(parsed) && parsed.length > 0) setTasks(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const sorted = useMemo(() => sortByPriority(tasks), [tasks]);
  const health = useMemo(() => academicHealth(tasks), [tasks]);

  function toggleComplete(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const isCompleting = t.status !== "done";
        if (isCompleting) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#8b5cf6", "#ec4899", "#2dd4bf", "#fbbf24"],
          });
        }
        return {
          ...t,
          status: isCompleting ? "done" : "todo",
          progress_minutes: isCompleting ? t.effort_minutes : t.progress_minutes,
        };
      }),
    );
  }

  function logFifteen(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.progress_minutes + 15 >= t.effort_minutes ? "in_progress" : "in_progress",
              progress_minutes: Math.min(t.effort_minutes, t.progress_minutes + 15),
            }
          : t,
      ),
    );
  }

  function startSuggestion(id: string) {
    logFifteen(id);
  }

  function addTask(task: Task) {
    setTasks((prev) => [task, ...prev]);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      <Header healthLabel={health.label} />

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <SmartSuggestion tasks={tasks} onStartTask={startSuggestion} />
          <AcademicHealth tasks={tasks} />
        </div>

        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Up next</p>
              <h2 className="text-xl font-bold">Priority list</h2>
            </div>
            <span className="text-xs text-muted">
              {tasks.filter((t) => t.status !== "done").length} active
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {sorted.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                rank={i + 1}
                onComplete={toggleComplete}
                onStart={logFifteen}
              />
            ))}
          </AnimatePresence>
        </section>
      </div>

      <SupabaseBanner />
      <AddTaskDialog onCreate={addTask} />
    </main>
  );
}

function SupabaseBanner() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => setConfigured(isSupabaseConfigured()), []);
  if (configured !== false) return null;
  return (
    <p className="mt-10 text-center text-xs text-muted">
      Running in local-only mode · add Supabase keys to <code className="font-mono">.env.local</code> to sync across devices.
    </p>
  );
}
