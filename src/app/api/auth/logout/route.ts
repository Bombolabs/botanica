import { NextRequest } from "next/server";
import { hostIsAllowed, jsonResponse } from "@/lib/http";
import { getSession } from "@/lib/session-server";

export async function POST(req: NextRequest) {
  if (!hostIsAllowed(req)) {
    return jsonResponse({ error: "invalid host" }, { status: 400 });
  }

  const session = await getSession();
  session.destroy();
  return jsonResponse({ ok: true });
}
