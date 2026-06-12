import { NextRequest } from "next/server";
import { generateSiweNonce } from "viem/siwe";
import { getClientIp, hostIsAllowed, jsonResponse, textResponse } from "@/lib/http";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session-server";

// Issue a fresh single-use nonce and stash it in the session. The client puts
// this nonce in the SIWE message it asks the wallet to sign.
export async function GET(req: NextRequest) {
  if (!hostIsAllowed(req)) {
    return jsonResponse({ error: "invalid host" }, { status: 400 });
  }

  const limited = rateLimit(`nonce:${getClientIp(req)}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

  const session = await getSession();
  session.nonce = generateSiweNonce();
  await session.save();
  return textResponse(session.nonce);
}
