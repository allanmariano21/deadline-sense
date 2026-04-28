import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(deadlineIso: string, now: Date = new Date()): string {
  const due = new Date(deadlineIso);
  const diffMs = due.getTime() - now.getTime();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  let core: string;
  if (minutes < 60) core = `${minutes} min`;
  else if (hours < 36) core = `${hours} hr`;
  else core = `${days} day${days === 1 ? "" : "s"}`;

  return past ? `${core} overdue` : `in ${core}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
