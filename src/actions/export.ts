"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess } from "@/lib/auth/session";

export async function exportProjectIssues(projectId: string, format: "csv" | "json") {
  const { project } = await requireProjectAccess(projectId, "VIEWER");

  const issues = await prisma.issue.findMany({
    where: { projectId },
    include: {
      assignee: { select: { name: true, email: true } },
      creator: { select: { name: true, email: true } },
    },
    orderBy: { issueNumber: "asc" },
  });

  if (format === "json") {
    return {
      success: true,
      filename: `${project.key}-issues-export.json`,
      data: JSON.stringify(issues, null, 2),
      mimeType: "application/json",
    };
  }

  // Format as CSV
  const headers = [
    "Key",
    "Number",
    "Title",
    "Description",
    "Status",
    "Priority",
    "Story Points",
    "Assignee Name",
    "Assignee Email",
    "Creator Name",
    "Creator Email",
    "Created At",
  ];

  const escapeCsv = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return "";
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = issues.map((i) => [
    escapeCsv(`${i.projectKey}-${i.issueNumber}`),
    escapeCsv(i.issueNumber),
    escapeCsv(i.title),
    escapeCsv(i.description),
    escapeCsv(i.status),
    escapeCsv(i.priority),
    escapeCsv(i.estimate),
    escapeCsv(i.assignee?.name),
    escapeCsv(i.assignee?.email),
    escapeCsv(i.creator?.name),
    escapeCsv(i.creator?.email),
    escapeCsv(i.createdAt.toISOString()),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return {
    success: true,
    filename: `${project.key}-issues-export.csv`,
    data: csvContent,
    mimeType: "text/csv",
  };
}
