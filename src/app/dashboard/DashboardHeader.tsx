"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function DashboardHeader({ address }: { address: string }) {
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your items</h1>
        <p className="font-mono text-xs text-black/50 dark:text-white/50">{short}</p>
      </div>
      <ConnectButton accountStatus="address" showBalance={false} />
    </header>
  );
}
