import { NextRequest } from "next/server";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
} from "@/lib/api/auth";
import { getWorkspaceAnalytics } from "@/actions/analytics";

type RouteContext = {
  params: Promise<{ workspaceId: string }> | { workspaceId: string };
};

async function getWorkspaceId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.workspaceId;
}

/**
 * GET /api/v1/workspaces/[workspaceId]/analytics
 * Returns workspace analytics (KPIs, charts, bottlenecks) for the given time range.
 * Query params: projectId (optional), timeRangeDays (default 30).
 */
export async function GET(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const workspaceId = await getWorkspaceId(context);
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const timeRangeParam = parseInt(url.searchParams.get("timeRangeDays") || "30", 10);
    const timeRangeDays = isNaN(timeRangeParam) || timeRangeParam <= 0
      ? 30
      : Math.min(timeRangeParam, 90);

    const result = await getWorkspaceAnalytics({
      workspaceId,
      projectId,
      timeRangeDays,
      userId: user.id,
    });

    if (!result.success || !result.data) {
      return apiError(result.error || "Failed to load analytics data", 500);
    }

    return apiSuccess(result.data);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}