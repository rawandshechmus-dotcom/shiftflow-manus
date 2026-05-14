import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestMutation = trpc.auth.requestEmailChange.useMutation({
    onSuccess: (data: any) => { setMessage(data.message); setStep("confirm"); },
    onError: (err: any) => setError(err.message),
  });
  const confirmMutation = trpc.auth.confirmEmailChange.useMutation({
    onSuccess: (data: any) => { setMessage(data.message); setStep("request"); },
    onError: (err: any) => setError(err.message),
  });

  // 2FA aktivieren
  const enable2FAMutation = trpc.auth.enable2FA.useMutation({
    onSuccess: (data: any) => { alert("QR-Code generiert (in Konsole). Scanne ihn mit Google Authenticator."); console.log(data.qrCode); },
  });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-xl mx-auto space-y-6">
        {/* E-Mail-Änderung */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-xl rounded-3xl border-0">
          <CardHeader><CardTitle className="text-xl dark:text-gray-100">E-Mail ändern</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {step === "request" ? (
              <>
                <Label className="dark:text-gray-300">Aktuelles Passwort</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="dark:bg-gray-700 dark:text-gray-100" />
                <Label className="dark:text-gray-300">Neue E-Mail</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="dark:bg-gray-700 dark:text-gray-100" />
              </>
            ) : (
              <>
                <Label className="dark:text-gray-300">Bestätigungscode (aus Konsole)</Label>
                <Input type="text" value={token} onChange={(e) => setToken(e.target.value)} className="dark:bg-gray-700 dark:text-gray-100" />
              </>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-600 dark:text-green-400 text-sm">{message}</p>}
            <Button className="w-full" onClick={() => step === "request" ? requestMutation.mutate({ newEmail, currentPassword }) : confirmMutation.mutate({ token })}>
              {step === "request" ? "Code anfordern" : "E-Mail bestätigen"}
            </Button>
          </CardContent>
        </Card>

        {/* 2FA aktivieren */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-xl rounded-3xl border-0">
          <CardHeader><CardTitle className="text-xl dark:text-gray-100">Zwei-Faktor-Authentifizierung</CardTitle></CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => enable2FAMutation.mutate()}>2FA aktivieren (QR-Code generieren)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}