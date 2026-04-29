import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // TODO: Backend auth.login procedure
  // const loginMutation = trpc.auth.login.useMutation({
  //   onSuccess: () => {
  //     window.location.href = "/";
  //   },
  //   onError: (err: any) => {
  //     setError(err.message);
  //   },
  // });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">ShiftFlow Login</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("Login disabled - use OAuth /app-auth");
          }}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg p-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Passwort"
            className="w-full border rounded-lg p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
            disabled={false}
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}