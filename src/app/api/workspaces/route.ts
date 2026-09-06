import { NextResponse } from "next/server";
import { getUserWorkspaces, createWorkspace } from "@/actions/workspaces";
import { requireAuth } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireAuth();

    const workspaces = await getUserWorkspaces();
    return NextResponse.json({ data: workspaces });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ [key: string]: string }> }) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    // Check if organization slug is provided, or get from user's workspace
    const orgIdOrSlug = body.orgIdOrSlug || user.workspaceMembers[0]?.workspace.organization.slug;

    if (!orgIdOrSlug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Organization ID or Slug is required." } },
        { status: 400 }
      );
    }

    const result = await createWorkspace(orgIdOrSlug, body);

    if (result.error) {
      if (result.error.includes("already exists")) {
        return NextResponse.json(
          { error: { code: "CONFLICT", message: result.error } },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.workspace }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
