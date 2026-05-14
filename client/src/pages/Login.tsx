import { useState } from "react";
import { trpc } from "@/lib/trpc";
import TwoFactorInput from "@/components/TwoFactorInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [twoFactorUserId, setTwoFactorUserId] = useState<number | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data: any) => {
      if (data.requiresTwoFactor) {
        setTwoFactorUserId(data.userId);
      } else {
        if (data.role === "admin" || data.role === "teamleader") {
          window.location.href = "/";
        } else {
          window.location.href = "/me";
        }
      }
    },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-md dark:bg-gray-800/70 dark:text-gray-100">
        <h1 className="text-2xl font-bold text-center mb-6">ShiftFlow Login</h1>

        {twoFactorUserId ? (
          <TwoFactorInput userId={twoFactorUserId} onSuccess={() => {}} />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              loginMutation.mutate({ email, password });
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Passwort"
              className="w-full border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Lädt..." : "Anmelden"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}