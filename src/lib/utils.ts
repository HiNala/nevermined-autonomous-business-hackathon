import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h`;
}

export function formatCredits(credits: number): string {
  return `${credits}cr`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
