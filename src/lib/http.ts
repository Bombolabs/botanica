import "server-only";
import type { NextRequest } from "next/server";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

export function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  return Response.json(body, {
    ...init,
    headers: {
      ...NO_STORE_HEADERS,
      ...init.headers,
    },
  });
}

export function textResponse(
  body: string,
  init: ResponseInit = {},
): Response {
  return new Response(body, {
    ...init,
    headers: {
      "content-type": "text/plain",
      ...NO_STORE_HEADERS,
      ...init.headers,
    },
  });
}

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return req.headers.get("x-real-ip") ?? "unknown";
}

export function getRequestHost(req: NextRequest): string | null {
  const host = req.headers.get("host")?.trim().toLowerCase();
  return host || null;
}

export function getExpectedHost(req: NextRequest): string {
  const configuredHost =
    process.env.APP_HOST || process.env.NEXT_PUBLIC_APP_HOST;

  if (configuredHost) return configuredHost.trim().toLowerCase();
  if (process.env.NODE_ENV === "production") return "botanica.bombolabs.xyz";

  return getRequestHost(req) ?? "localhost";
}

export function hostIsAllowed(req: NextRequest): boolean {
  return getRequestHost(req) === getExpectedHost(req);
}
