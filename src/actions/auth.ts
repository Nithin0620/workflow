"use server";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Registers a new user with legacy/custom credentials and creates their default organization and workspace
 */
export async function registerUser(input: RegisterInput) {
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
    return { error: "An account with this email already exists." };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user + default Organization + default Workspace in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    const orgSlug = `${slugify(name)}-org-${Math.random().toString(36).substring(2, 6)}`;
    const org = await tx.organization.create({
      data: {
        name: `${name}'s Organization`,
        slug: orgSlug,
        ownerId: user.id,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: "General Workspace",
        slug: "general",
        organizationId: org.id,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    return { user, org, workspace };
  });

  return { success: true, userId: result.user.id, defaultOrgSlug: result.org.slug, defaultWorkspaceSlug: result.workspace.slug };
}
