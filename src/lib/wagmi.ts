"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet } from "wagmi/chains";
import { berachain } from "./chains";

/**
 * Wallet config. Berachain is the primary chain (where the collections live);
 * mainnet is included so users aren't nagged with "wrong network" while just
 * signing in (SIWE signing is chain-agnostic).
 */
export const wagmiConfig = getDefaultConfig({
  appName: "Botanica Portal",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "MISSING_WC_PROJECT_ID",
  chains: [berachain, mainnet],
  ssr: true,
});
