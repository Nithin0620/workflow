import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractIssueKeys } from "@/lib/github/client";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import crypto from "crypto";

/**
 * Validates GitHub Webhook HMAC-SHA256 signature if GITHUB_WEBHOOK_SECRET is set.
 */
function verifySignature(payload: string, signature: string | null, secret?: string): boolean {
  if (!secret) return true; // If no secret configured, allow processing
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = req.headers.get("x-github-event");
    const signature = req.headers.get("x-hub-signature-256");
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    if (!event) {
      return NextResponse.json({ error: "Missing X-GitHub-Event header" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const repoFullName = payload.repository?.full_name; // e.g. "octocat/Hello-World"
    const repoOwner = payload.repository?.owner?.login || payload.repository?.owner?.name;
    const repoName = payload.repository?.name;

    if (!repoFullName) {
      return NextResponse.json({ message: "No repository in payload" }, { status: 200 });
    }

    // Find all Workflow projects linked to this repository
    const matchedRepositories = await prisma.projectRepository.findMany({
      where: {
        OR: [
          { repoUrl: { contains: repoFullName, mode: "insensitive" } },
          {
            AND: [
              { repoOwner: { equals: repoOwner, mode: "insensitive" } },
              { repoName: { equals: repoName, mode: "insensitive" } },
            ],
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            key: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!matchedRepositories.length) {
      return NextResponse.json({ message: "No matching project repository found" }, { status: 200 });
    }

    const processedLinks: Array<{ issueKey: string; type: string; title: string }> = [];

    for (const repo of matchedRepositories) {
      const project = repo.project;

      // 1. Handle PULL REQUEST Event
      if (event === "pull_request" && payload.pull_request) {
        const pr = payload.pull_request;
        const action = payload.action; // opened, closed, reopened, edited, synchronize
        const prTitle = pr.title || "";
        const prBody = pr.body || "";
        const prUrl = pr.html_url;
        const prNumber = pr.number;
        const prAuthor = pr.user?.login || "github-user";
        const prAvatar = pr.user?.avatar_url;
        const isMerged = pr.merged || false;
        const isClosed = pr.state === "closed";

        const status = isMerged ? "MERGED" : isClosed ? "CLOSED" : "OPEN";

        // Extract issue keys from PR title, branch name, and body
        const searchCorpus = `${prTitle} ${pr.head?.ref || ""} ${prBody}`;
        const issueKeys = extractIssueKeys(searchCorpus, project.key);

        for (const { issueNumber, fullKey } of issueKeys) {
          const issue = await prisma.issue.findUnique({
            where: {
              projectId_issueNumber: {
                projectId: project.id,
                issueNumber,
              },
            },
          });

          if (!issue) continue;

          // Upsert Git Link
          await prisma.issueGitLink.upsert({
            where: {
              issueId_type_url: {
                issueId: issue.id,
                type: "PULL_REQUEST",
                url: prUrl,
              },
            },
            create: {
              issueId: issue.id,
              type: "PULL_REQUEST",
              title: `#${prNumber} ${prTitle}`,
              url: prUrl,
              refNumber: prNumber,
              sha: pr.head?.sha || null,
              author: prAuthor,
              authorAvatar: prAvatar,
              status,
              repoOwner,
              repoName,
            },
            update: {
              title: `#${prNumber} ${prTitle}`,
              status,
              sha: pr.head?.sha || null,
              author: prAuthor,
              authorAvatar: prAvatar,
            },
          });

          // Log Activity
          await prisma.activityLog.create({
            data: {
              workspaceId: project.workspaceId,
              issueId: issue.id,
              actorId: issue.creatorId,
              action: `GITHUB_PR_${action.toUpperCase()}`,
              details: {
                prNumber,
                prTitle,
                prUrl,
                status,
                author: prAuthor,
              },
            },
          });

          // Auto-move issue to DONE if PR is merged
          if (isMerged && issue.status !== "DONE") {
            await prisma.issue.update({
              where: { id: issue.id },
              data: { status: "DONE" },
            });

            broadcastProjectEvent({
              type: "ISSUE_UPDATED",
              projectId: project.id,
              timestamp: Date.now(),
              actor: { id: "github-bot", name: `GitHub (${prAuthor})` },
              data: { issue: { ...issue, status: "DONE" } },
            });
          } else if (action === "opened" && issue.status === "TODO") {
            // Optionally move TODO -> IN_PROGRESS on PR open
            await prisma.issue.update({
              where: { id: issue.id },
              data: { status: "IN_PROGRESS" },
            });

            broadcastProjectEvent({
              type: "ISSUE_UPDATED",
              projectId: project.id,
              timestamp: Date.now(),
              actor: { id: "github-bot", name: `GitHub (${prAuthor})` },
              data: { issue: { ...issue, status: "IN_PROGRESS" } },
            });
          }

          processedLinks.push({ issueKey: fullKey, type: "PULL_REQUEST", title: prTitle });
        }
      }

      // 2. Handle PUSH (Commits & Branches) Event
      if (event === "push" && Array.isArray(payload.commits)) {
        const branchRef = payload.ref || ""; // e.g. "refs/heads/feat/PROJ-12-auth"
        const branchName = branchRef.replace(/^refs\/heads\//, "");
        const commits = payload.commits;

        // Process commits
        for (const commit of commits) {
          const commitMsg = commit.message || "";
          const commitUrl = commit.url || `https://github.com/${repoFullName}/commit/${commit.id}`;
          const commitSha = commit.id?.slice(0, 7) || "";
          const commitAuthor = commit.author?.name || commit.author?.username || "Committer";

          const issueKeys = extractIssueKeys(commitMsg, project.key);

          for (const { issueNumber, fullKey } of issueKeys) {
            const issue = await prisma.issue.findUnique({
              where: {
                projectId_issueNumber: {
                  projectId: project.id,
                  issueNumber,
                },
              },
            });

            if (!issue) continue;

            await prisma.issueGitLink.upsert({
              where: {
                issueId_type_url: {
                  issueId: issue.id,
                  type: "COMMIT",
                  url: commitUrl,
                },
              },
              create: {
                issueId: issue.id,
                type: "COMMIT",
                title: commitMsg.split("\n")[0].slice(0, 120),
                url: commitUrl,
                sha: commitSha,
                author: commitAuthor,
                status: "OPEN",
                repoOwner,
                repoName,
              },
              update: {
                title: commitMsg.split("\n")[0].slice(0, 120),
                sha: commitSha,
                author: commitAuthor,
              },
            });

            processedLinks.push({ issueKey: fullKey, type: "COMMIT", title: commitSha });
          }
        }

        // Check if branch name itself references an issue
        const branchIssueKeys = extractIssueKeys(branchName, project.key);
        for (const { issueNumber, fullKey } of branchIssueKeys) {
          const issue = await prisma.issue.findUnique({
            where: {
              projectId_issueNumber: {
                projectId: project.id,
                issueNumber,
              },
            },
          });

          if (!issue) continue;

          const branchUrl = `https://github.com/${repoFullName}/tree/${branchName}`;

          await prisma.issueGitLink.upsert({
            where: {
              issueId_type_url: {
                issueId: issue.id,
                type: "BRANCH",
                url: branchUrl,
              },
            },
            create: {
              issueId: issue.id,
              type: "BRANCH",
              title: branchName,
              url: branchUrl,
              author: payload.pusher?.name || "dev",
              status: "OPEN",
              repoOwner,
              repoName,
            },
            update: {
              title: branchName,
              author: payload.pusher?.name || "dev",
            },
          });

          processedLinks.push({ issueKey: fullKey, type: "BRANCH", title: branchName });
        }
      }

      // 3. Handle Branch Creation (create event)
      if (event === "create" && payload.ref_type === "branch") {
        const branchName = payload.ref;
        const branchUrl = `https://github.com/${repoFullName}/tree/${branchName}`;
        const sender = payload.sender?.login || "dev";

        const issueKeys = extractIssueKeys(branchName, project.key);
        for (const { issueNumber, fullKey } of issueKeys) {
          const issue = await prisma.issue.findUnique({
            where: {
              projectId_issueNumber: {
                projectId: project.id,
                issueNumber,
              },
            },
          });

          if (!issue) continue;

          await prisma.issueGitLink.upsert({
            where: {
              issueId_type_url: {
                issueId: issue.id,
                type: "BRANCH",
                url: branchUrl,
              },
            },
            create: {
              issueId: issue.id,
              type: "BRANCH",
              title: branchName,
              url: branchUrl,
              author: sender,
              status: "OPEN",
              repoOwner,
              repoName,
            },
            update: {
              title: branchName,
              author: sender,
            },
          });

          processedLinks.push({ issueKey: fullKey, type: "BRANCH", title: branchName });
        }
      }
    }

    return NextResponse.json({
      success: true,
      event,
      processed: processedLinks.length,
      links: processedLinks,
    });
  } catch (err: any) {
    console.error("[GitHub Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
