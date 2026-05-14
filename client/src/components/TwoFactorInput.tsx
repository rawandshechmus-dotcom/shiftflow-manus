import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TwoFactorInput({ userId, onSuccess }: { userId: number; onSuccess: () => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const login2FAMutation = trpc.auth.login2FA.useMutation({
    onSuccess: (data: any) => {
      if (data.role === "admin" || data.role === "teamleader") window.location.href = "/";
      else window.location.href = "/me";
    },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Gib den 6‑stelligen Code aus deiner Authenticator‑App ein.</p>
      <Input
        type="text"
        maxLength={6}
        placeholder="000000"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="text-center text-2xl tracking-widest"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button className="w-full" disabled={token.length !== 6 || login2FAMutation.isPending} onClick={() => login2FAMutation.mutate({ userId, token })}>
        {login2FAMutation.isPending ? "Prüfe…" : "Bestätigen"}
      </Button>
    </div>
  );
}