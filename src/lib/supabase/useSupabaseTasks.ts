"use client";

import { useCallback, useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { sampleTasks } from "@/lib/sample-tasks";
import { isSupabaseConfigured } from "./client";
import { fetchTasks, insertTask, updateTask } from "./tasks";

const STORAGE_KEY = "deadline-sense.tasks.v1";

export function useSupabaseTasks(authenticated: boolean) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const useSupabase = isSupabaseConfigured() && authenticated;

  // Initial load
  useEffect(() => {
    if (!authenticated) return;

    if (useSupabase) {
      fetchTasks()
        .then((rows) => {
          setTasks(rows.length > 0 ? rows : []);
          setHydrated(true);
        })
        .catch(() => {
          // Fall back to localStorage on error
          loadFromStorage();
        });
    } else {
      loadFromStorage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, useSupabase]);

  function loadFromStorage() {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const parsed = raw ? (JSON.parse(raw) as Task[]) : null;
      setTasks(Array.isArray(parsed) && parsed.length > 0 ? parsed : sampleTasks);
    } catch {
      setTasks(sampleTasks);
    }
    setHydrated(true);
  }

  // Persist to localStorage when not using Supabase
  useEffect(() => {
    if (!hydrated || useSupabase || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, hydrated, useSupabase]);

  const addTask = useCallback(async (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    if (useSupabase) {
      try { await insertTask(task); } catch { /* optimistic — don't rollback */ }
    }
  }, [useSupabase]);

  const patchTask = useCallback(async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (useSupabase) {
      try { await updateTask(id, patch); } catch { /* optimistic */ }
    }
  }, [useSupabase]);

  return { tasks, hydrated, addTask, patchTask, useSupabase };
}
