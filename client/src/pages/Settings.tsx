import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QRCodeImage from "@/components/QRCodeImage";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 2FA‑States
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorToken, setTwoFactorToken] = useState("");

  // E‑Mail‑Mutationen
  const requestMutation = trpc.auth.requestEmailChange.useMutation({
    onSuccess: (data: any) => { setMessage(data.message); setStep("confirm"); },
    onError: (err: any) => setError(err.message),
  });
  const confirmMutation = trpc.auth.confirmEmailChange.useMutation({
    onSuccess: (data: any) => { setMessage(data.message); setStep("request"); },
    onError: (err: any) => setError(err.message),
  });

  // 2FA‑Mutationen
  const enable2FAMutation = trpc.auth.enable2FA.useMutation({
    onSuccess: (data: any) => {
      setQrCodeDataUrl(data.qrCode);
      setTwoFactorSecret(data.secret);
      setMessage("Scanne den QR‑Code oder gib das Secret manuell ein.");
    },
    onError: (err: any) => setError(err.message),
  });

  const verify2FAMutation = trpc.auth.verify2FAEnable.useMutation({
    onSuccess: () => {
      setMessage("2FA erfolgreich aktiviert!");
      setQrCodeDataUrl(null);
      setTwoFactorSecret(null);
      setTwoFactorToken("");
    },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-xl mx-auto space-y-6">
        {/* E‑Mail‑Änderung */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-xl rounded-3xl border-0">
          <CardHeader><CardTitle className="text-xl dark:text-gray-100">E‑Mail ändern</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {step === "request" ? (
              <>
                <Label className="dark:text-gray-300">Aktuelles Passwort</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="dark:bg-gray-700 dark:text-gray-100" />
                <Label className="dark:text-gray-300">Neue E‑Mail</Label>
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
              {step === "request" ? "Code anfordern" : "E‑Mail bestätigen"}
            </Button>
          </CardContent>
        </Card>

        {/* 2FA aktivieren */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-xl rounded-3xl border-0">
          <CardHeader><CardTitle className="text-xl dark:text-gray-100">Zwei‑Faktor‑Authentifizierung</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!qrCodeDataUrl ? (
              <Button className="w-full" onClick={() => enable2FAMutation.mutate()} disabled={enable2FAMutation.isPending}>
                {enable2FAMutation.isPending ? "Generiere QR‑Code..." : "2FA aktivieren (QR‑Code generieren)"}
              </Button>
            ) : (
              <>
                <QRCodeImage dataUrl={qrCodeDataUrl} />
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-500 dark:text-gray-400">Secret manuell eingeben</summary>
                  <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg break-all font-mono">
                    {twoFactorSecret}
                  </div>
                </details>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="text-center text-2xl tracking-widest dark:bg-gray-700 dark:text-gray-100"
                />
                <Button
                  className="w-full"
                  disabled={twoFactorToken.length !== 6 || verify2FAMutation.isPending}
                  onClick={() => verify2FAMutation.mutate({ token: twoFactorToken })}
                >
                  {verify2FAMutation.isPending ? "Prüfe..." : "2FA bestätigen"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}