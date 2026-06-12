"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  type AuthenticationStatus,
} from "@rainbow-me/rainbowkit";
import { createSiweMessage } from "viem/siwe";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi";
import { SIWE_STATEMENT } from "@/lib/siwe";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthenticationStatus>("loading");

  // Hydrate auth status from the server session cookie on mount.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => active && setStatus(d.address ? "authenticated" : "unauthenticated"))
      .catch(() => active && setStatus("unauthenticated"));
    return () => {
      active = false;
    };
  }, []);

  const adapter = useMemo(
    () =>
      createAuthenticationAdapter({
        getNonce: async () => {
          const res = await fetch("/api/auth/nonce");
          return res.text();
        },
        createMessage: ({ nonce, address, chainId }) =>
          createSiweMessage({
            domain: window.location.host,
            address: address as `0x${string}`,
            statement: SIWE_STATEMENT,
            uri: window.location.origin,
            version: "1",
            chainId,
            nonce,
          }),
        verify: async ({ message, signature }) => {
          const res = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message, signature }),
          });
          const ok = res.ok;
          if (ok) setStatus("authenticated");
          return ok;
        },
        signOut: async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          setStatus("unauthenticated");
        },
      }),
    [],
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider adapter={adapter} status={status}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
