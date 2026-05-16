import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
  teamLeaderProcedure,
  viewerProcedure,
} from "./_core/trpc";
import { sdk } from "./_core/sdk";
import {
  getActiveIssues,
  getEfficiency,
  getEmployeeCountByStatus,
  getEmployeeTrend,
  getMachineCountByStatus,
  getMachinePerformance,
  getRecentActivities,
  getShiftUtilization,
  listNotifications,
  createNotification,
  markNotificationAsRead,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  listEmployees,
  createEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  listMachines,
  createMachine,
  updateMachineStatus,
  deleteMachine,
  listAssignments,
  createAssignment,
  deleteAssignment,
  getEmployeeByUserId,
  getAssignmentsForEmployee,
  getDb,
  getEmployeeUserId,
  listOpenHandovers,
  completeHandover,
  createHandover,
  setTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  getUserByOpenId,
  setPendingEmail,
  confirmEmailChange,
} from "./db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(key) ?? [];
  const recent = attempts.filter(t => now - t < windowMs);
  rateLimitMap.set(key, recent);
  if (recent.length >= maxAttempts) return false;
  recent.push(now);
  return true;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});


function verifyTOTP(secret: string, token: string): boolean {
  const now = Math.floor(Date.now() / 30000);
  for (let offset = -1; offset <= 1; offset++) {
    const expected = speakeasy.totp({
      secret,
      encoding: "base32",
      time: (now + offset) * 30,
    });
    if (expected === token) return true;
  }
  return false;
}

export const appRouter = router({
  system: systemRouter,

  // ─── AUTH ────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME);
      return { success: true } as const;
    }),

    // Login mit echtem bcrypt + 2FA‑Erkennung
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht erreichbar");

        const rows = await db.select().from(users).where(eq(users.openId, input.email)).limit(1);
        const user = rows[0] as any;

        if (!user || !user.passwordHash) throw new Error("Ungültige Email oder Passwort.");

        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) throw new Error("Ungültige Email oder Passwort.");

        // Wenn 2FA aktiviert ist, nur den Hinweis zurückgeben
        if (user.twoFactorEnabled) {
          return { requiresTwoFactor: true, userId: user.id };
        }

        // Kein 2FA → Session sofort erstellen
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        await createNotification({
          userId: user.id,
          message: `${user.name ?? "Ein Benutzer"} hat sich angemeldet.`,
          type: "info",
        });
        return { success: true, role: user.role };
      }),

    // 2FA aktivieren (QR‑Code + Secret)
    enable2FA: protectedProcedure.mutation(async ({ ctx }) => {
      const secret = speakeasy.generateSecret({
        name: `ShiftFlow:${ctx.user.email}`,
        length: 20,
      });
      await setTwoFactorSecret(ctx.user.id, secret.base32);
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);
      return { secret: secret.base32, qrCode: qrCodeDataUrl };
    }),

    // 2FA‑Aktivierung mit Code bestätigen
    verify2FAEnable: protectedProcedure
      .input(z.object({ token: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const key = `2fa-verify-${ctx.user.id}`;
        if (!checkRateLimit(key)) throw new Error("Zu viele Versuche. Bitte warte 60 Sekunden.");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        const user = result[0];
        if (!user?.twoFactorSecret) throw new Error("Kein Secret vorhanden.");

        if (!verifyTOTP(user.twoFactorSecret, input.token)) {
          throw new Error("Ungültiger Code.");
        }
        await enableTwoFactor(user.id);
        return { success: true };
      }),

    // 2FA‑Login (zweiter Schritt)
    login2FA: publicProcedure
      .input(z.object({ userId: z.number(), token: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const key = `2fa-login-${input.userId}`;
        if (!checkRateLimit(key)) throw new Error("Zu viele Versuche. Bitte warte 60 Sekunden.");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        const user = result[0];
        if (!user?.twoFactorSecret) throw new Error("2FA nicht eingerichtet.");

        if (!verifyTOTP(user.twoFactorSecret, input.token)) {
          throw new Error("Ungültiger Code.");
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        await createNotification({
          userId: user.id,
          message: `${user.name ?? "Ein Benutzer"} hat sich angemeldet (2FA).`,
          type: "info",
        });
        return { success: true, role: user.role };
      }),

    // E‑Mail‑Änderung anfordern (sendet echte E‑Mail)
    requestEmailChange: protectedProcedure
      .input(z.object({ newEmail: z.string().email(), currentPassword: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user?.passwordHash) throw new Error("Benutzer nicht gefunden.");
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new Error("Aktuelles Passwort ist falsch.");

        const token = randomBytes(32).toString("hex");
        await setPendingEmail(user.id, input.newEmail, token);

        // E‑Mail senden
        try {
          const info = await transporter.sendMail({
            from: '"ShiftFlow" <noreply@shiftflow.local>',
            to: input.newEmail,
            subject: "E‑Mail‑Änderung bestätigen",
            text: `Dein Bestätigungscode lautet: ${token}`,
            html: `<p>Dein Bestätigungscode lautet:</p><h2>${token}</h2>`,
          });
          console.log(`[EMAIL CHANGE] E‑Mail gesendet an ${input.newEmail} (Message ID: ${info.messageId})`);
        } catch (mailError) {
          console.error("E‑Mail‑Versand fehlgeschlagen:", mailError);
          throw new Error("E‑Mail konnte nicht gesendet werden.");
        }

        return { success: true, message: "Bestätigungscode an neue E‑Mail gesendet." };
      }),

    // E‑Mail‑Änderung bestätigen
    confirmEmailChange: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await confirmEmailChange(ctx.user.id, input.token);
        return { success: true, message: "E‑Mail erfolgreich geändert." };
      }),
  }), // Ende auth

  // ─── DASHBOARD ───────────────────────────────────────────
  dashboard: router({
    kpis: teamLeaderProcedure.query(async ({ ctx }) => {
      const employees = await getEmployeeCountByStatus(ctx.teamFilter ?? "");
      const machines = await getMachineCountByStatus();
      const efficiency = await getEfficiency();
      const shiftUtil = await getShiftUtilization();
      return {
        employees: employees.find(e => e.status === "present")?.count ?? 0,
        employeeChange: +3,
        activeMachines: machines.find(m => m.status === "active")?.count ?? 0,
        totalMachines: machines.reduce((acc, m) => acc + m.count, 0) ?? 0,
        efficiency,
        shiftUtilization: shiftUtil,
      };
    }),
    activeIssues: protectedProcedure.query(() => getActiveIssues()),
    recentActivities: protectedProcedure.query(() => getRecentActivities()),
  }),

  // ─── EMPLOYEE ────────────────────────────────────────────
  employee: router({
    list: teamLeaderProcedure.query(({ ctx }) => listEmployees(ctx.teamFilter ?? "")),
    create: adminProcedure
      .input(z.object({ firstName: z.string().min(1), lastName: z.string().min(1), personnelNumber: z.string().min(1), team: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const result = await createEmployee(input);
        const emp = Array.isArray(result) ? result[0] : result;
        await createNotification({ userId: ctx.user?.id ?? emp?.id, message: `Mitarbeiter ${input.firstName} ${input.lastName} wurde angelegt.`, type: "success" });
        return result;
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["present","sick","vacation","absent"]) }))
      .mutation(async ({ input }) => {
        await updateEmployeeStatus(input.id, input.status);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const all = await listEmployees();
        const emp = all.find(e => e.id === input.id);
        await deleteEmployee(input.id);
        if (emp) await createNotification({ userId: ctx.user?.id ?? emp.id, message: `Mitarbeiter ${emp.firstName} ${emp.lastName} wurde entfernt.`, type: "error" });
        return { success: true };
      }),
    me: viewerProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return null;
      const emp = await getEmployeeByUserId(ctx.user.id);
      if (!emp) return null;
      const fromDate = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
      const toDate   = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      const shifts = await getAssignmentsForEmployee(emp.id, fromDate, toDate);
      return { ...emp, shifts };
    }),
  }),

  // ─── MACHINE ─────────────────────────────────────────────
  machine: router({
    list: teamLeaderProcedure.query(() => listMachines()),
    create: adminProcedure
      .input(z.object({ name: z.string().min(1), serialNumber: z.string().min(1), location: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const result = await createMachine(input);
        await createNotification({ userId: ctx.user?.id, message: `Maschine ${input.name} wurde hinzugefügt.`, type: "success" });
        return result;
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["active","inactive","maintenance","error"]), stopReason: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await updateMachineStatus(input.id, input.status, input.stopReason);
        if (input.stopReason) await createNotification({ userId: ctx.user?.id, message: `Maschine (ID ${input.id}) auf ${input.status} gesetzt (Grund: ${input.stopReason}).`, type: "warning" });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMachine(input.id);
        return { success: true };
      }),
  }),

  // ─── ASSIGNMENT ──────────────────────────────────────────
  assignment: router({
    list: teamLeaderProcedure
      .input(z.object({ year: z.number(), month: z.number() }).optional())
      .query(async ({ input }) => {
        const now = new Date();
        const year = input?.year ?? now.getFullYear();
        const month = input?.month ?? now.getMonth() + 1;
        return await listAssignments(year, month);
      }),
    create: adminProcedure
      .input(z.object({
        employeeId: z.number(),
        machineId: z.number(),
        shiftDate: z.string(),
        shiftType: z.enum(["early", "late", "night"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createAssignment(input);
        const userId = await getEmployeeUserId(input.employeeId);
        if (userId) {
          await createNotification({
            userId: userId,
            message: `Neue Schichtzuweisung: ${input.shiftType} am ${input.shiftDate}`,
            type: "info",
          });
        }
        return result;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAssignment(input.id);
        return { success: true };
      }),
  }),

  // ─── HANDOVER ────────────────────────────────────────────
  handover: router({
    openForCurrentShift: protectedProcedure
      .input(z.object({ shiftType: z.string(), date: z.string() }))
      .query(async ({ input }) => {
        return await listOpenHandovers(input.shiftType, input.date);
      }),
    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Nicht authentifiziert");
        await completeHandover(input.id, ctx.user.id);
        return { success: true };
      }),
    create: protectedProcedure
      .input(z.object({
        fromShift: z.enum(["early", "late", "night"]),
        toShift: z.enum(["early", "late", "night"]),
        date: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createHandover(input);
      }),
  }),

  // ─── NOTIFICATION ────────────────────────────────────────
  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => listNotifications(ctx.user.id)),
    unreadCount: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => getUnreadNotificationCount(ctx.user.id)),
    markAsRead: protectedProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
      await markNotificationAsRead(input, ctx.user.id);
      return { success: true };
    }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
    create: protectedProcedure
      .input(z.object({ message: z.string().min(1), type: z.enum(["info","success","warning","error"]) }))
      .mutation(async ({ input, ctx }) => {
        await createNotification({ ...input, userId: ctx.user.id });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;