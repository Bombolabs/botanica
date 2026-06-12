import "server-only";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "./session";

/** Read/write the iron-session from a Next.js App Router context. */
export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
