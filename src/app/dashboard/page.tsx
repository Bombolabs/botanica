import { redirect } from "next/navigation";
import { getSession } from "@/lib/session-server";
import { DashboardHeader } from "./DashboardHeader";
import { ItemsGrid } from "./ItemsGrid";

/**
 * Server-protected dashboard. The session cookie is the source of truth for
 * "logged in" — not the wallet connection in the browser. No session address
 * => bounce to the landing page.
 */
export default async function DashboardPage() {
  const session = await getSession();
  if (!session.address) redirect("/");

  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      <DashboardHeader address={session.address} />
      <ItemsGrid />
    </main>
  );
}
