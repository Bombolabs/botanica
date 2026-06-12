import { getAddress, type Address } from "viem";
import { getSession } from "@/lib/session-server";
import { getEcosystemItems } from "@/lib/items-server";

// Returns the logged-in wallet's items across all collections.
// The address comes from the session cookie — a client can never request
// someone else's holdings.
export async function GET() {
  const session = await getSession();
  if (!session.address) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const owner = getAddress(session.address) as Address;
    const collections = await getEcosystemItems(owner);
    return Response.json({ address: owner, collections });
  } catch (err) {
    console.error("items fetch failed:", err);
    return Response.json({ error: "fetch failed" }, { status: 502 });
  }
}
