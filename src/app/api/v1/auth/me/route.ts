import { NextRequest } from "next/server";
import { apiError, apiSuccess, apiUnauthorized, getApiUser, handleCorsOptions } from "@/lib/api/auth";

export async function OPTIONS(req: Request) {
  return handleCorsOptions(req);
}

export async function GET(req: Request | NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized", req);
    }

    return apiSuccess(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          workspaceMembers: user.workspaceMembers,
        },
      },
      200,
      req
    );
  } catch (err: any) {
    return apiError(err?.message || "Something went wrong", 500, req);
  }
}

