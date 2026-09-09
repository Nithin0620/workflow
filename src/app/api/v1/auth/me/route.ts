import { NextRequest } from "next/server";
import { apiError, apiSuccess, apiUnauthorized, getApiUser } from "@/lib/api/auth";

export async function GET(req: Request | NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    return apiSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        workspaceMembers: user.workspaceMembers,
      },
    });
  } catch (err: any) {
    return apiError(err?.message || "Something went wrong", 500);
  }
}
