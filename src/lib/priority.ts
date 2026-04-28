import type { EnergyLevel, Task } from "./types";

export interface PriorityBreakdown {
  score: number;
  urgency: number;
  workloadPressure: number;
  difficulty: number;
  hoursUntilDue: number;
  hoursRemaining: number;
}

export function getPriorityBreakdown(task: Task, now: Date = new Date()): PriorityBreakdown {
  const due = new Date(task.deadline);
  const hoursUntilDue = Math.max(0.1, (due.getTime() - now.getTime()) / 3_600_000);
  const remainingMinutes = Math.max(0, task.effort_minutes - task.progress_minutes);
  const hoursRemaining = remainingMinutes / 60;

  // Urgency curve: 1 week away ≈ 0, due now ≈ 1.
  const urgency = Math.min(1, Math.max(0, 1 - hoursUntilDue / 168));

  // Pressure: how much of the remaining window the work would consume.
  const workloadPressure = Math.min(1, hoursRemaining / Math.max(1, hoursUntilDue));

  const difficulty = task.difficulty / 5;

  const score = urgency * 0.55 + workloadPressure * 0.3 + difficulty * 0.15;

  return { score, urgency, workloadPressure, difficulty, hoursUntilDue, hoursRemaining };
}

export function sortByPriority(tasks: Task[], now: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    return getPriorityBreakdown(b, now).score - getPriorityBreakdown(a, now).score;
  });
}

export interface CramRisk {
  level: "calm" | "warming" | "danger";
  message: string;
  hoursPerNightIfDelayed: number;
  daysToStart: number;
}

export function getCramRisk(task: Task, now: Date = new Date()): CramRisk {
  const { hoursUntilDue, hoursRemaining } = getPriorityBreakdown(task, now);
  const realisticHoursPerDay = 2.5;
  const usableDays = Math.max(0.25, hoursUntilDue / 24);

  if (task.status === "done" || hoursRemaining <= 0) {
    return {
      level: "calm",
      message: "All wrapped up — nice.",
      hoursPerNightIfDelayed: 0,
      daysToStart: usableDays,
    };
  }

  const daysOfBuffer = usableDays - hoursRemaining / realisticHoursPerDay;
  const hoursPerNightIfDelayed = hoursRemaining / Math.max(0.5, usableDays - 1);

  if (daysOfBuffer < 0.5) {
    return {
      level: "danger",
      message: `Cram alert! You'd need ~${hoursPerNightIfDelayed.toFixed(1)}h tonight to finish.`,
      hoursPerNightIfDelayed,
      daysToStart: 0,
    };
  }
  if (daysOfBuffer < 2) {
    return {
      level: "warming",
      message: `Start within ${Math.max(1, Math.round(daysOfBuffer))} day${daysOfBuffer < 1.5 ? "" : "s"} to avoid cramming.`,
      hoursPerNightIfDelayed,
      daysToStart: Math.max(0, daysOfBuffer),
    };
  }
  return {
    level: "calm",
    message: "Plenty of room — pace yourself.",
    hoursPerNightIfDelayed,
    daysToStart: daysOfBuffer,
  };
}

const energyDifficultyCeiling: Record<EnergyLevel, number> = {
  tired: 2,
  okay: 4,
  focused: 5,
};

export function suggestNextTask(
  tasks: Task[],
  options: { availableMinutes: number; energy: EnergyLevel; now?: Date },
): Task | null {
  const { availableMinutes, energy, now = new Date() } = options;
  const ceiling = energyDifficultyCeiling[energy];

  const candidates = tasks
    .filter((t) => t.status !== "done")
    .filter((t) => t.difficulty <= ceiling)
    .map((t) => {
      const breakdown = getPriorityBreakdown(t, now);
      const remaining = Math.max(0, t.effort_minutes - t.progress_minutes);
      // Reward chunks that fit the window. Big tasks still surface but slightly lower.
      const fit = remaining <= availableMinutes ? 1 : Math.max(0.4, availableMinutes / remaining);
      const energyBoost = energy === "focused" ? 1 + (t.difficulty / 10) : 1;
      return { task: t, score: breakdown.score * fit * energyBoost };
    })
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.task ?? null;
}

export function academicHealth(tasks: Task[], now: Date = new Date()): {
  status: "on_track" | "at_risk" | "overloaded";
  label: string;
  ratio: number;
} {
  const active = tasks.filter((t) => t.status !== "done");
  if (active.length === 0) {
    return { status: "on_track", label: "Inbox zero ✨", ratio: 0 };
  }
  const risky = active.filter((t) => getCramRisk(t, now).level !== "calm");
  const ratio = risky.length / active.length;
  if (ratio === 0) return { status: "on_track", label: "On track", ratio };
  if (ratio < 0.5) return { status: "at_risk", label: "At risk", ratio };
  return { status: "overloaded", label: "Overloaded", ratio };
}
