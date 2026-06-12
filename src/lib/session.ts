import type { SessionOptions } from "iron-session";

const sessionPassword = process.env.SESSION_PASSWORD;

if (!sessionPassword || sessionPassword.length < 32) {
  throw new Error("SESSION_PASSWORD must be at least 32 characters long.");
}

export type SessionData = {
  /** Single-use SIWE nonce, issued before sign-in. */
  nonce?: string;
  /** Set once a signature is verified — this is the "logged in" marker. */
  address?: string;
  chainId?: number;
};

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "botanica_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};
