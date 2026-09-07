import { NextResponse } from "next/server";
import { markNotificationAsRead } from "@/actions/notifications";

export async function PATCH(req: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const { notificationId } = await params;
    await markNotificationAsRead(notificationId);

    return NextResponse.json({ success: true });
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
