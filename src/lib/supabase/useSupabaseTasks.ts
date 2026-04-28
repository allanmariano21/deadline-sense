"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Task } from "@/lib/types";
import { fetchTasks, insertTask, updateTask } from "./tasks";

export function useSupabaseTasks(user: User | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!user) return;

    setHydrated(false);
    fetchTasks()
      .then((rows) => {
        setTasks(rows);
        setHydrated(true);
      })
      .catch((err) => {
        console.error("fetchTasks error:", err);
        setTasks([]);
        setHydrated(true);
      });
  }, [user?.id]);

  const addTask = useCallback(async (task: Task) => {
    if (!user) return;
    setTasks((prev) => [task, ...prev]);
    try {
      await insertTask(task);
    } catch (err) {
      console.error("insertTask error:", err);
    }
  }, [user]);

  const patchTask = useCallback(async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await updateTask(id, patch);
    } catch (err) {
      console.error("updateTask error:", err);
    }
  }, []);

  return { tasks, hydrated, addTask, patchTask };
}
