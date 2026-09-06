import { NextResponse } from "next/server";
import { getWorkspaceProjects, createProject } from "@/actions/projects";
import { requireWorkspaceMember } from "@/lib/auth/session";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const projects = await getWorkspaceProjects(workspaceId);

    return NextResponse.json({ data: projects });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 }
      );
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const body = await req.json();

    const result = await createProject(workspaceId, body);

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

    return NextResponse.json({ data: result.project }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 }
      );
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
