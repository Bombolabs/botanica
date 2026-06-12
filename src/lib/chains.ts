import { defineChain } from "viem";

/**
 * Berachain mainnet (chainId 80094) — where the comB / B Side / Bloomy Tunes
 * collections live. Defined explicitly so we don't depend on viem's bundled
 * chain list staying in sync.
 */
export const berachain = defineChain({
  id: 80094,
  name: "Berachain",
  nativeCurrency: { name: "BERA", symbol: "BERA", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.BERACHAIN_RPC_URL || "https://rpc.berachain.com"],
    },
  },
  blockExplorers: {
    default: { name: "Berascan", url: "https://berascan.com" },
  },
  contracts: {
    // Multicall3 is deployed at the canonical address on Berachain.
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
});
