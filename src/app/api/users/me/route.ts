import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "You must be logged in to perform this action." } },
        { status: 401 }
      );
    }

    // Do not return passwordHash
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({ data: safeUser });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message || "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
