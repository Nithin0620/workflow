import { NextRequest } from "next/server";
import { z } from "zod";
import { registerUser } from "@/actions/auth";
import { apiError, apiSuccess, handleCorsOptions, signApiToken } from "@/lib/api/auth";
import { prisma } from "@/lib/db/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function OPTIONS(req: Request) {
  return handleCorsOptions(req);
}

export async function POST(req: Request | NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid input format", 400, req);
    }

    const res = await registerUser(parsed.data);
    if (res.error) {
      return apiError(res.error, 400, req);
    }

    const user = await prisma.user.findUnique({
      where: { id: res.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return apiError("User creation failed", 500, req);
    }

    const token = signApiToken({
      id: user.id,
      email: user.email!,
      name: user.name,
    });

    const isProd = process.env.NODE_ENV === "production";
    const cookieDomain = isProd ? "; Domain=.ssh.net.in" : "";
    const cookieHeader = `auth_token=${token}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly${isProd ? "; Secure" : ""}${cookieDomain}`;

    return apiSuccess(
      {
        token,
        user,
      },
      201,
      req,
      {
        "Set-Cookie": cookieHeader,
      }
    );
  } catch (err: any) {
    console.error("Register route error:", err);
    return apiError(err?.message || "Something went wrong", 500, req);
  }
}
