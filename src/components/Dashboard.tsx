"use client";

import { AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import confetti from "canvas-confetti";
import { Loader2, LogOut } from "lucide-react";
import type { Task } from "@/lib/types";
import { sortByPriority, academicHealth } from "@/lib/priority";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import { useSupabaseTasks } from "@/lib/supabase/useSupabaseTasks";
import { Header } from "./Header";
import { SmartSuggestion } from "./SmartSuggestion";
import { AcademicHealth } from "./AcademicHealth";
import { TaskCard } from "./TaskCard";
import { AddTaskDialog } from "./AddTaskDialog";
import { LoginScreen } from "./AuthGate";

export function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const supabaseEnabled = isSupabaseConfigured();

  // When Supabase is not configured, treat as "authenticated" so we fall through to localStorage.
  const authenticated = !supabaseEnabled || !!user;
  const { tasks, hydrated, addTask, patchTask, useSupabase } = useSupabaseTasks(authenticated);

  const sorted = useMemo(() => sortByPriority(tasks), [tasks]);
  const health = useMemo(() => academicHealth(tasks), [tasks]);

  // Show login screen if Supabase is configured but user is not signed in
  if (supabaseEnabled && !authLoading && !user) {
    return <LoginScreen onDone={() => {}} />;
  }

  // Spinner while auth state resolves
  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  async function toggleComplete(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const isCompleting = task.status !== "done";
    if (isCompleting) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#8b5cf6", "#ec4899", "#2dd4bf", "#fbbf24"],
      });
    }
    await patchTask(id, {
      status: isCompleting ? "done" : "todo",
      progress_minutes: isCompleting ? task.effort_minutes : task.progress_minutes,
    });
  }

  async function logFifteen(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await patchTask(id, {
      status: "in_progress",
      progress_minutes: Math.min(task.effort_minutes, task.progress_minutes + 15),
    });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="relative">
        <Header healthLabel={health.label} />
        {user && (
          <button
            onClick={signOut}
            title={`Signed in as ${user.email}`}
            className="absolute top-0 right-0 p-2 rounded-xl text-muted hover:text-foreground hover:bg-white/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <SmartSuggestion tasks={tasks} onStartTask={logFifteen} />
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

      {!useSupabase && (
        <p className="mt-10 text-center text-xs text-muted">
          Local-only mode · add Supabase keys to <code className="font-mono">.env.local</code> to sync.
        </p>
      )}

      <AddTaskDialog onCreate={(task: Task) => addTask(task)} />
    </main>
  );
}
