import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signApiToken,
  getApiUser,
  requireApiAuth,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from "@/lib/api/auth";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { GET as meRoute } from "@/app/api/v1/auth/me/route";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

describe("API Auth Helper & Mobile Auth Endpoints", () => {
  const secret = process.env.NEXTAUTH_SECRET || "default-secret";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signApiToken", () => {
    it("signs a valid JWT with payload and 30-day expiration", () => {
      const payload = {
        id: "user-123",
        email: "alice@example.com",
        name: "Alice Developer",
      };

      const token = signApiToken(payload);
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.id).toBe("user-123");
      expect(decoded.email).toBe("alice@example.com");
      expect(decoded.name).toBe("Alice Developer");
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe("getApiUser & requireApiAuth", () => {
    it("authenticates user from Bearer JWT token header", async () => {
      const mockUser = {
        id: "user-bearer-1",
        email: "bearer@example.com",
        name: "Bearer User",
        workspaceMembers: [
          {
            id: "wm-1",
            role: "OWNER",
            workspace: { id: "ws-1", name: "Main WS" },
          },
        ],
      };

      (prisma.user.findFirst as any).mockResolvedValue(mockUser);

      const token = signApiToken({
        id: "user-bearer-1",
        email: "bearer@example.com",
        name: "Bearer User",
      });

      const req = new Request("http://localhost/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = await getApiUser(req);
      expect(user).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: "user-bearer-1" }, { email: "bearer@example.com" }],
        },
        include: {
          workspaceMembers: {
            include: {
              workspace: true,
            },
          },
        },
      });
    });

    it("authenticates user from NextAuth session cookies if no Bearer token", async () => {
      const mockUser = {
        id: "user-cookie-2",
        email: "cookie@example.com",
        name: "Cookie User",
        workspaceMembers: [],
      };

      (getToken as any).mockResolvedValue({
        id: "user-cookie-2",
        email: "cookie@example.com",
      });
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);

      const req = new Request("http://localhost/api/v1/auth/me");
      const user = await getApiUser(req);

      expect(user).toEqual(mockUser);
      expect(getToken).toHaveBeenCalled();
    });

    it("returns null for invalid token or unauthenticated request", async () => {
      (getToken as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/auth/me", {
        headers: {
          Authorization: "Bearer invalid.jwt.token",
        },
      });

      const user = await getApiUser(req);
      expect(user).toBeNull();
    });

    it("requireApiAuth returns user and workspaceMembers when valid", async () => {
      const mockUser = {
        id: "user-auth-3",
        email: "auth3@example.com",
        workspaceMembers: [{ id: "wm-3" }],
      };
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);

      const token = signApiToken({ id: "user-auth-3", email: "auth3@example.com" });
      const req = new Request("http://localhost/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await requireApiAuth(req);
      expect(result.user).toEqual(mockUser);
      expect(result.workspaceMembers).toEqual(mockUser.workspaceMembers);
    });

    it("requireApiAuth throws error when unauthorized", async () => {
      (getToken as any).mockResolvedValue(null);
      const req = new Request("http://localhost/api/v1/auth/me");

      await expect(requireApiAuth(req)).rejects.toThrow("Unauthorized");
    });
  });

  describe("API Response Helpers", () => {
    it("returns proper JSON structure and HTTP status codes", async () => {
      const successRes = apiSuccess({ ok: true }, 201);
      expect(successRes.status).toBe(201);
      expect(await successRes.json()).toEqual({ ok: true });

      const errRes = apiError("Bad request", 400);
      expect(errRes.status).toBe(400);
      expect(await errRes.json()).toEqual({ error: "Bad request" });

      const unauthRes = apiUnauthorized();
      expect(unauthRes.status).toBe(401);
      expect(await unauthRes.json()).toEqual({ error: "Unauthorized" });

      const forbRes = apiForbidden();
      expect(forbRes.status).toBe(403);
      expect(await forbRes.json()).toEqual({ error: "Forbidden" });

      const notFoundRes = apiNotFound();
      expect(notFoundRes.status).toBe(404);
      expect(await notFoundRes.json()).toEqual({ error: "Not found" });
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("successfully logs in with valid credentials and returns token + user", async () => {
      const password = "ValidPassword123!";
      const passwordHash = await hashPassword(password);

      const mockDbUser = {
        id: "user-login-1",
        email: "user@example.com",
        name: "Login User",
        image: "https://example.com/avatar.png",
        passwordHash,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockDbUser);

      const req = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password,
        }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.user).toEqual({
        id: mockDbUser.id,
        name: mockDbUser.name,
        email: mockDbUser.email,
        image: mockDbUser.image,
      });

      const decoded = jwt.verify(data.token, secret) as any;
      expect(decoded.id).toBe(mockDbUser.id);
      expect(decoded.email).toBe(mockDbUser.email);
    });

    it("rejects login with wrong password", async () => {
      const passwordHash = await hashPassword("CorrectPassword123!");
      const mockDbUser = {
        id: "user-login-2",
        email: "wrong@example.com",
        passwordHash,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockDbUser);

      const req = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "wrong@example.com",
          password: "WrongPassword456!",
        }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid email or password");
    });

    it("rejects login with non-existent user", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "notfound@example.com",
          password: "Password123!",
        }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid email or password");
    });

    it("rejects login with invalid email schema", async () => {
      const req = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "not-an-email",
          password: "Password123!",
        }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid email");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns authenticated user profile when token is valid", async () => {
      const mockUser = {
        id: "user-me-1",
        email: "me@example.com",
        name: "Me User",
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        workspaceMembers: [
          {
            id: "wm-1",
            role: "MEMBER",
            workspace: { id: "ws-1", name: "Alpha", slug: "alpha" },
          },
        ],
      };

      (prisma.user.findFirst as any).mockResolvedValue(mockUser);

      const token = signApiToken({
        id: "user-me-1",
        email: "me@example.com",
      });

      const req = new Request("http://localhost/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await meRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.user.id).toBe(mockUser.id);
      expect(data.user.email).toBe(mockUser.email);
      expect(data.user.workspaceMembers).toHaveLength(1);
    });

    it("returns 401 Unauthorized when not authenticated", async () => {
      (getToken as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/auth/me");
      const res = await meRoute(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });
  });
});
