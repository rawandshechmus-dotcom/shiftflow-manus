import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();
export const transformer = superjson;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
    },
  },
});