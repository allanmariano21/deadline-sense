export type EnergyLevel = "tired" | "okay" | "focused";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  course?: string;
  notes?: string;
  deadline: string;
  effort_minutes: number;
  difficulty: Difficulty;
  status: TaskStatus;
  progress_minutes: number;
  emoji?: string;
  created_at: string;
}

export interface ClassBlock {
  id: string;
  title: string;
  weekday: number;
  start_minutes: number;
  end_minutes: number;
}
