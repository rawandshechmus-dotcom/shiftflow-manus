import type { CookieOptions, Request } from "express";

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
    secure: process.env.NODE_ENV === "production",
  };
}