import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { apiError, apiSuccess, apiUnauthorized, signApiToken } from "@/lib/api/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request | NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid credentials format", 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return apiUnauthorized("Invalid email or password");
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return apiUnauthorized("Invalid email or password");
    }

    const token = signApiToken({
      id: user.id,
      email: user.email!,
      name: user.name,
    });

    return apiSuccess({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (err: any) {
    console.error("Login route error:", err);
    return apiError(err?.message || "Something went wrong", 500);
  }
}

