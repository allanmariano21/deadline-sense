import type { Task } from "@/lib/types";
import { getSupabaseBrowser } from "./client";

// Cast to any because we have no generated DB types — avoids "never" overload errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Supabase not configured");
  return sb;
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await db()
    .from("tasks")
    .select("*")
    .order("deadline", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function insertTask(task: Task): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Supabase not configured");

  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await db()
    .from("tasks")
    .insert({
      id: task.id,
      user_id: user.id,
      title: task.title,
      course: task.course ?? null,
      notes: task.notes ?? null,
      deadline: task.deadline,
      effort_minutes: task.effort_minutes,
      difficulty: task.difficulty,
      status: task.status,
      progress_minutes: task.progress_minutes,
      emoji: task.emoji ?? null,
    });

  if (error) throw error;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const { error } = await db()
    .from("tasks")
    .update(patch)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await db().from("tasks").delete().eq("id", id);
  if (error) throw error;
}
