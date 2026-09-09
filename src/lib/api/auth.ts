import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "default-secret";

export type ApiTokenPayload = {
  id: string;
  email: string;
  name?: string | null;
};

/**
 * Signs a JWT token with 30-day expiration for mobile/API clients.
 */
export function signApiToken(payload: ApiTokenPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name ?? undefined,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

/**
 * Extracts authentication from either `Authorization: Bearer <token>` (JWT)
 * OR NextAuth session cookies (via next-auth/jwt getToken).
 * Looks up the user in `prisma.user` with `workspaceMembers: { include: { workspace: true } }`.
 */
export async function getApiUser(req: Request) {
  let userId: string | null = null;
  let userEmail: string | null = null;

  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id?: string;
        sub?: string;
        email?: string;
      };
      if (decoded.id) userId = decoded.id;
      else if (decoded.sub) userId = decoded.sub;
      if (decoded.email) userEmail = decoded.email;
    } catch {
      // Invalid / expired bearer token
      return null;
    }
  }

  // 2. If no valid bearer token found, attempt NextAuth session extraction from cookies
  if (!userId && !userEmail) {
    try {
      const nextAuthToken = await getToken({
        req: req as any,
        secret: JWT_SECRET,
      });

      if (nextAuthToken) {
        if (nextAuthToken.id) userId = nextAuthToken.id as string;
        if (nextAuthToken.sub && !userId) userId = nextAuthToken.sub;
        if (nextAuthToken.email) userEmail = nextAuthToken.email;
      }
    } catch {
      // Ignore NextAuth cookie parsing errors
    }
  }

  if (!userId && !userEmail) {
    return null;
  }

  // Look up user in prisma
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(userEmail ? [{ email: userEmail.toLowerCase() }] : []),
      ],
    },
    include: {
      workspaceMembers: {
        include: {
          workspace: true,
        },
      },
    },
  });

  return user;
}

/**
 * Enforces API authentication. Returns user and workspaceMembers, or throws an error.
 */
export async function requireApiAuth(req: Request) {
  const user = await getApiUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return {
    user,
    workspaceMembers: user.workspaceMembers,
  };
}

/**
 * Standard API Response Helpers
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiUnauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function apiForbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function apiNotFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
