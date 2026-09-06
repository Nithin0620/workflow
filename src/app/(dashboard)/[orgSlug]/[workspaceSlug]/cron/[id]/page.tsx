import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getCronRunDetail } from "@/actions/cron-jobs";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Bot,
  GitBranch,
  FileCode2,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BugFinding } from "@/lib/ai/bug-hunter";

interface CronRunPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string; id: string }>;
}

const fmtDate = (d: Date) =>
  new Date(d).toLocaleString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function CronRunDetailPage({ params }: CronRunPageProps) {
  const { orgSlug, workspaceSlug, id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const res = await getCronRunDetail(id);
  if (!res.success || !res.log) notFound();

  const log = res.log;
  let findings: BugFinding[] = [];
  if (log.rawOutput) {
    try {
      const parsed = JSON.parse(log.rawOutput);
      if (Array.isArray(parsed)) findings = parsed;
    } catch {}
  }

  const backHref = `/${orgSlug}/${workspaceSlug}/cron`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-white pb-16">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Cron Jobs</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
              log.status === "SUCCESS"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}
          >
            {log.status === "SUCCESS" ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{log.cronJobName || "Manual Run"}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                  log.status === "SUCCESS"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                }`}
              >
                {log.status}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {log.projectName && <span className="font-semibold text-neutral-200">{log.projectName}</span>}
              {log.projectKey && <span className="font-mono text-neutral-500"> ({log.projectKey})</span>}
              {" · "}
              {log.triggerSource} trigger
            </p>
          </div>
        </div>

        <Link
          href={log.projectId ? `/${orgSlug}/${workspaceSlug}/projects/${log.projectKey}/board` : backHref}
          className="hidden md:flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
        >
          <Bot className="h-3.5 w-3.5" />
          <span>Open Project Board</span>
        </Link>
      </div>

      {/* Meta stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Executed At</span>
          </div>
          <div className="mt-2 text-sm font-bold text-white">{fmtDate(log.createdAt)}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Duration</span>
          </div>
          <div className="mt-2 text-sm font-bold text-white">{log.durationMs}ms</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <FileCode2 className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Findings</span>
          </div>
          <div className="mt-2 text-sm font-bold text-white">{log.findingsCount}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Bot className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Issues Created</span>
          </div>
          <div className="mt-2 text-sm font-bold text-white">{log.issuesCreated}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-2">Summary</h2>
        <p className="text-sm text-neutral-300">{log.summary}</p>
      </div>

      {/* Error */}
      {log.error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-rose-400 font-mono mb-2">Error Details</h2>
          <pre className="whitespace-pre-wrap font-mono text-xs text-rose-300">{log.error}</pre>
        </div>
      )}

      {/* Findings */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
          DETECTED FINDINGS & PATCHES ({findings.length})
        </h2>
        {findings.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-500">
            <FileCode2 className="h-8 w-8 mx-auto text-neutral-600 mb-2" />
            <p className="text-sm font-semibold text-neutral-300">No findings recorded on this run.</p>
          </div>
        ) : (
          findings.map((finding, idx) => (
            <div key={idx} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{finding.title}</span>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                    finding.severity === "HIGH" || finding.severity === "URGENT"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {finding.severity}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-neutral-300">{finding.filePath}</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">{finding.rootCause}</p>
              {finding.proposedPatch && (
                <pre className="rounded-lg border border-neutral-800 bg-neutral-900/90 p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  <code>{finding.proposedPatch}</code>
                </pre>
              )}
              {finding.reproduction && (
                <p className="text-xs text-neutral-500"><strong className="text-neutral-300">Reproduction:</strong> {finding.reproduction}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}