import { differenceInCalendarMonths, differenceInCalendarDays } from "date-fns";
import type { Goal } from "./schema";

function parseDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

// Rounded-up months remaining. Past deadlines return 0.
export function monthsUntil(deadlineIso: string, now: Date = new Date()): number {
  const d = parseDate(deadlineIso);
  const diff = differenceInCalendarMonths(d, now);
  return Math.max(0, diff);
}

// Approximate months between two ISO dates, using days/30.44 so fractional
// months surface naturally for "projected date" math.
function monthsFractional(from: Date, to: Date): number {
  const days = differenceInCalendarDays(to, from);
  return days / 30.44;
}

export function requiredMonthlyContribution(
  goal: Goal,
  now: Date = new Date()
): number | null {
  if (!goal.deadline) return null;
  const months = monthsUntil(goal.deadline, now);
  const gap = Math.max(0, goal.targetAmount - goal.currentAmount);
  if (months <= 0) return gap; // due now or overdue — need it all
  return gap / months;
}

export function projectedCompletion(
  goal: Goal,
  now: Date = new Date()
): Date | null {
  const monthly = goal.monthlyContribution;
  if (!monthly || monthly <= 0) return null;
  const gap = Math.max(0, goal.targetAmount - goal.currentAmount);
  if (gap === 0) return now;
  const months = gap / monthly;
  const d = new Date(now);
  d.setDate(d.getDate() + Math.ceil(months * 30.44));
  return d;
}

export type TrackStatus = "ahead" | "onTrack" | "slipping" | "complete" | "none";

export function trackStatus(
  goal: Goal,
  now: Date = new Date()
): TrackStatus {
  if (goal.targetAmount <= 0) return "none";
  if (goal.currentAmount >= goal.targetAmount) return "complete";
  if (!goal.deadline) return "none";

  const start = new Date(goal.createdAt);
  const deadline = parseDate(goal.deadline);
  const totalMonths = Math.max(0.0001, monthsFractional(start, deadline));
  const elapsedMonths = Math.max(0, monthsFractional(start, now));
  const expectedPct = Math.min(100, (elapsedMonths / totalMonths) * 100);
  const actualPct = (goal.currentAmount / goal.targetAmount) * 100;

  if (actualPct >= expectedPct + 5) return "ahead";
  if (actualPct >= expectedPct - 5) return "onTrack";
  return "slipping";
}

export type GoalStatus = {
  goal: Goal;
  percent: number;
  requiredMonthly: number | null;
  projected: Date | null;
  track: TrackStatus;
  progressTone: "default" | "warning" | "success";
};

export function computeGoalStatus(goal: Goal, now: Date = new Date()): GoalStatus {
  const percent =
    goal.targetAmount > 0
      ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
      : 0;
  const track = trackStatus(goal, now);
  const progressTone: GoalStatus["progressTone"] =
    track === "complete" || track === "ahead"
      ? "success"
      : track === "slipping"
      ? "warning"
      : "default";
  return {
    goal,
    percent,
    requiredMonthly: requiredMonthlyContribution(goal, now),
    projected: projectedCompletion(goal, now),
    track,
    progressTone,
  };
}

export const TRACK_LABEL: Record<TrackStatus, string> = {
  complete: "Complete",
  ahead: "Ahead",
  onTrack: "On track",
  slipping: "Slipping",
  none: "",
};
