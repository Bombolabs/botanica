"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Botanica Portal</h1>
        <p className="max-w-md text-sm text-black/60 dark:text-white/60">
          Connect your wallet and sign in to see your B Side, comB and Bloomy
          Tunes items together in one place.
        </p>
      </div>

      <ConnectButton />

      <p className="text-xs text-black/40 dark:text-white/40">
        Signing in costs nothing and never starts a transaction.
      </p>

      <Link
        href="/dashboard"
        className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100"
      >
        Go to dashboard →
      </Link>
    </main>
  );
}
