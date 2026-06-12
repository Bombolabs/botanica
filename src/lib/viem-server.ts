import "server-only";
import { createPublicClient, http } from "viem";
import { berachain } from "./chains";

/** Read-only Berachain client for server-side ownership lookups + SIWE verify. */
export const publicClient = createPublicClient({
  chain: berachain,
  transport: http(process.env.BERACHAIN_RPC_URL || "https://rpc.berachain.com"),
});
