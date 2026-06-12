import { NextRequest } from "next/server";
import { parseSiweMessage, verifySiweMessage } from "viem/siwe";
import { getSession } from "@/lib/session-server";
import { publicClient } from "@/lib/viem-server";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session.nonce) {
    return Response.json({ ok: false, error: "no nonce" }, { status: 422 });
  }

  let message: string;
  let signature: `0x${string}`;
  try {
    ({ message, signature } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "bad body" }, { status: 400 });
  }

  // The signed message's domain must match the host we're served from.
  const domain = req.headers.get("host") ?? undefined;

  const valid = await verifySiweMessage(publicClient, {
    message,
    signature,
    nonce: session.nonce,
    domain,
  });

  if (!valid) {
    return Response.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  const fields = parseSiweMessage(message);
  session.address = fields.address;
  session.chainId = fields.chainId;
  session.nonce = undefined; // burn the nonce
  await session.save();

  return Response.json({ ok: true, address: fields.address });
}
