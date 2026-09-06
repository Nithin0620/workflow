"use server";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { provisionDefaultUserWorkspace } from "@/lib/auth/provisioning";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterResult = {
  error?: string;
  success?: boolean;
  userId?: string;
  defaultOrgSlug?: string;
  defaultWorkspaceSlug?: string;
};

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Registers a new user with legacy/custom credentials and creates their default organization and workspace
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    // Account exists with a password already — they should sign in instead
    if (existingUser.passwordHash) {
      return { error: "An account with this email already exists." };
    }
    // Placeholder / OAuth-only account (e.g. from a prior invite): complete
    // registration by attaching a password so they can sign in and accept.
    const passwordHash = await hashPassword(password);
    const completed = await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash, name: name.trim() },
    });
    return { success: true, userId: completed.id };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user + default Organization + Workspace + Starter Demo Project in a single ACID transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    const { org, workspace, project } = await provisionDefaultUserWorkspace(tx, user);

    return { user, org, workspace, project };
  });

  return {
    success: true,
    userId: result.user.id,
    defaultOrgSlug: result.org.slug,
    defaultWorkspaceSlug: result.workspace.slug,
  };
}
