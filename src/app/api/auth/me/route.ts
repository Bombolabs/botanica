import { getSession } from "@/lib/session-server";

// Current session — drives RainbowKit's authenticationStatus on the client.
export async function GET() {
  const session = await getSession();
  return Response.json({
    address: session.address ?? null,
    chainId: session.chainId ?? null,
  });
}
