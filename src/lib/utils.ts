import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string or timestamp into a human-friendly format
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Generates an issue key e.g. "DEV-102"
 */
export function formatIssueKey(projectKey: string, issueNumber: number): string {
  return `${projectKey.toUpperCase()}-${issueNumber}`;
}

/**
 * Converts a title to a clean URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, "")     // Trim leading and trailing hyphens
    .replace(/--+/g, "-");       // Collapse consecutive hyphens
}
