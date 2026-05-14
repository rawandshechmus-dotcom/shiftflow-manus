import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";

/**
 * Lokaler Login-Endpunkt – erstellt/findet einen Benutzer direkt in der Datenbank
 * und setzt ein Session-Cookie. Kein OAuth nötig.
 */
export function registerLocalAuthRoutes(app: Express) {
  app.get("/api/local-login", async (req: Request, res: Response) => {
    const openId = (req.query.openId as string) || "local-admin";
    const name = (req.query.name as string) || "Admin";
    const email = (req.query.email as string) || "admin@shiftflow.local";
    const loginMethod = "local";
    const role = (req.query.role as string) === "admin" ? "admin" : "user";

    try {
      // Benutzer in der Datenbank anlegen oder updaten
      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod,
        lastSignedIn: new Date(),
        role,   // falls upsertUser role unterstützt, sonst ignorieren wir das erstmal
      });

      // Einfaches Session-Token generieren (Base64-kodierter openId + Ablaufdatum)
      const sessionPayload = JSON.stringify({
        openId,
        name,
        email,
        role,
        expiresAt: Date.now() + ONE_YEAR_MS,
      });
      const sessionToken = Buffer.from(sessionPayload).toString("base64");

      // Cookie setzen – gleiche Optionen wie OAuth
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Zurück zur Startseite
      res.redirect(302, "/");
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      res.status(500).json({ error: "Lokaler Login fehlgeschlagen" });
    }
  });
}