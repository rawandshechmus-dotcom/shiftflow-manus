import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Echten Benutzer aus dem Session-Cookie laden
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Keinen Fallback setzen – Benutzer bleibt null
    console.warn("[Context] Keine gültige Session");
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}