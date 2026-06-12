import { NextRequest } from "next/server";
import { hostIsAllowed, jsonResponse } from "@/lib/http";
import { getSession } from "@/lib/session-server";

// Current session — drives RainbowKit's authenticationStatus on the client.
export async function GET(req: NextRequest) {
  if (!hostIsAllowed(req)) {
    return jsonResponse({ error: "invalid host" }, { status: 400 });
  }

  const session = await getSession();
  return jsonResponse({
    address: session.address ?? null,
    chainId: session.chainId ?? null,
  });
}
