import { NextResponse } from "next/server";
import { addIssueComment } from "@/actions/issues";

export async function POST(req: Request, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const { issueId } = await params;
    const body = await req.json();

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Comment content is required" } },
        { status: 400 }
      );
    }

    const result = await addIssueComment(issueId, body.content);

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

    return NextResponse.json({ data: result.comment }, { status: 201 });
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
