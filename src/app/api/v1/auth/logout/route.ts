import { NextRequest } from "next/server";
import { handleCorsOptions, apiSuccess } from "@/lib/api/auth";

export async function OPTIONS(req: Request) {
  return handleCorsOptions(req);
}

export async function POST(req: Request | NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieDomain = isProd ? "; Domain=.ssh.net.in" : "";

  const response = apiSuccess({ success: true }, 200, req);

  const cookiesToClear = [
    "auth_token",
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ];

  cookiesToClear.forEach((name) => {
    response.headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly${isProd ? "; Secure" : ""}${cookieDomain}`
    );
    response.headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly${isProd ? "; Secure" : ""}`
    );
  });

  return response;
}
