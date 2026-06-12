import type { SessionOptions } from "iron-session";

export type SessionData = {
  /** Single-use SIWE nonce, issued before sign-in. */
  nonce?: string;
  /** Set once a signature is verified — this is the "logged in" marker. */
  address?: string;
  chainId?: number;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "botanica_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};
