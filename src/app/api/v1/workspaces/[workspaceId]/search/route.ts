import { NextRequest } from "next/server";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
} from "@/lib/api/auth";
import { searchWorkspace } from "@/actions/search";

type RouteContext = {
  params: Promise<{ workspaceId: string }> | { workspaceId: string };
};

async function getWorkspaceId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.workspaceId;
}

/**
 * GET /api/v1/workspaces/[workspaceId]/search?q=<query>
 * Searches projects and issues in a workspace.
 */
export async function GET(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const workspaceId = await getWorkspaceId(context);
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";

    const result = await searchWorkspace(workspaceId, q, user.id);
    if (!result.success) {
      return apiError("Forbidden", 403);
    }

    return apiSuccess({ results: result.results });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}