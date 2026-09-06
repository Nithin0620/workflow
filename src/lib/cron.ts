import { CronExpressionParser } from "cron-parser";

export function computeNextRun(schedule: string, enabled: boolean): Date | null {
  if (!enabled) return null;
  try {
    return CronExpressionParser.parse(schedule).next().toDate();
  } catch {
    return null;
  }
}