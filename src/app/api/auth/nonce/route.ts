import { generateSiweNonce } from "viem/siwe";
import { getSession } from "@/lib/session-server";

// Issue a fresh single-use nonce and stash it in the session. The client puts
// this nonce in the SIWE message it asks the wallet to sign.
export async function GET() {
  const session = await getSession();
  session.nonce = generateSiweNonce();
  await session.save();
  return new Response(session.nonce, {
    headers: { "content-type": "text/plain" },
  });
}
