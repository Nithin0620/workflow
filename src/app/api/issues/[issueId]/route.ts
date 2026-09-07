import { NextResponse } from "next/server";
import { getIssueDetails, updateIssueDetails, deleteIssue } from "@/actions/issues";

export async function GET(req: Request, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const { issueId } = await params;
    const issue = await getIssueDetails(issueId);

    if (!issue) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Issue not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: issue });
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

export async function PATCH(req: Request, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const { issueId } = await params;
    const body = await req.json();

    const result = await updateIssueDetails(issueId, body);

    if (result.error) {
      if (result.error.includes("not found")) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: result.error } },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.issue });
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

export async function DELETE(req: Request, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const { issueId } = await params;
    const result = await deleteIssue(issueId);

    if (result.error) {
      if (result.error.includes("not found")) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: result.error } },
          { status: 404 }
        );
      }
      if (result.error.includes("Forbidden")) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: result.error } },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json(null, { status: 204 });
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
