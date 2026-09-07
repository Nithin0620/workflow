import { NextResponse } from "next/server";
import { getUserNotifications, markAllNotificationsAsRead } from "@/actions/notifications";

export async function GET() {
  try {
    const { notifications } = await getUserNotifications();
    return NextResponse.json({ data: notifications });
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

export async function PATCH() {
  try {
    await markAllNotificationsAsRead();
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
