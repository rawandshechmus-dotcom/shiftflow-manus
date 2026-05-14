import { inferAsyncReturnType } from "@trpc/server";
import { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { sdk } from "./sdk";

export async function createContext({ req, res }: CreateHTTPContextOptions) {
  let user = null;
  try {
    const auth = await sdk.authenticateRequest(req);
    user = auth.user;
  } catch (err) {
    // Ignorieren – kein User
  }
  return { req, res, user };
}

export type Context = inferAsyncReturnType<typeof createContext>;