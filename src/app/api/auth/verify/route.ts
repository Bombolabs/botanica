import { NextRequest } from "next/server";
import { parseSiweMessage, verifySiweMessage } from "viem/siwe";
import { getClientIp, getExpectedHost, hostIsAllowed, jsonResponse } from "@/lib/http";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session-server";
import { publicClient } from "@/lib/viem-server";

export async function POST(req: NextRequest) {
  if (!hostIsAllowed(req)) {
    return jsonResponse({ ok: false, error: "invalid host" }, { status: 400 });
  }

  const limited = rateLimit(`verify:${getClientIp(req)}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

  const session = await getSession();

  if (!session.nonce) {
    return jsonResponse({ ok: false, error: "no nonce" }, { status: 422 });
  }

  let message: string;
  let signature: `0x${string}`;
  try {
    ({ message, signature } = await req.json());
  } catch {
    return jsonResponse({ ok: false, error: "bad body" }, { status: 400 });
  }

  // The signed message's domain must match the configured production host.
  const domain = getExpectedHost(req);

  const valid = await verifySiweMessage(publicClient, {
    message,
    signature,
    nonce: session.nonce,
    domain,
  });

  if (!valid) {
    return jsonResponse({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  const fields = parseSiweMessage(message);
  session.address = fields.address;
  session.chainId = fields.chainId;
  session.nonce = undefined; // burn the nonce
  await session.save();

  return jsonResponse({ ok: true, address: fields.address });
}
