import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/api/auth";
import { updateProfileSchema } from "@/lib/validators";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

/**
 * GET /api/v1/profile
 * Returns current user's profile and workspace memberships.
 */
export async function GET(req: Request | NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        workspaceMembers: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!fullUser) {
      return apiNotFound("User not found");
    }

    const userProfile = {
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      image: fullUser.image,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
      workspaceMemberships: fullUser.workspaceMembers,
    };

    return apiSuccess({
      profile: userProfile,
      user: userProfile,
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/profile
 * Updates user profile details (name, image) and optionally changes password.
 */
export async function PATCH(req: Request | NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid profile payload", 400);
    }

    const { name, image, currentPassword, newPassword } = parsed.data;

    let newPasswordHash: string | undefined = undefined;

    if (newPassword) {
      if (!currentPassword) {
        return apiError("Current password is required to change password", 400);
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!dbUser || !dbUser.passwordHash) {
        return apiError("This account does not use password authentication", 400);
      }

      const isMatch = await verifyPassword(currentPassword, dbUser.passwordHash);
      if (!isMatch) {
        return apiError("Incorrect current password", 400);
      }

      newPasswordHash = await hashPassword(newPassword);
    }

    const updateData: {
      name?: string;
      image?: string | null;
      passwordHash?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (image !== undefined) {
      updateData.image = image && image.length > 0 ? image : null;
    }
    if (newPasswordHash !== undefined) {
      updateData.passwordHash = newPasswordHash;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess({
      user: updated,
      profile: updated,
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
