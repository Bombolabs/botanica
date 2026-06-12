import { getAddress, type Address } from "viem";
import { NextRequest } from "next/server";
import { getClientIp, hostIsAllowed, jsonResponse } from "@/lib/http";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { getSession } from "@/lib/session-server";
import { getEcosystemItems } from "@/lib/items-server";

// Returns the logged-in wallet's items across all collections.
// The address comes from the session cookie — a client can never request
// someone else's holdings.
export async function GET(req: NextRequest) {
  if (!hostIsAllowed(req)) {
    return jsonResponse({ error: "invalid host" }, { status: 400 });
  }

  const limited = rateLimit(`items:${getClientIp(req)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

  const session = await getSession();
  if (!session.address) {
    return jsonResponse({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const owner = getAddress(session.address) as Address;
    const collections = await getEcosystemItems(owner);
    return jsonResponse({ address: owner, collections });
  } catch (err) {
    console.error("items fetch failed:", err);
    return jsonResponse({ error: "fetch failed" }, { status: 502 });
  }
}
