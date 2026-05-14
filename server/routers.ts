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
import * as otplib from "otplib";
import QRCode from "qrcode";
import crypto from "crypto"

export const appRouter = router({
  system: systemRouter,

  // AUTH
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME);
      return { success: true } as const;
    }),
    // ── 2FA ──────────────────────────────────────────────────────────────
enable2FA: protectedProcedure.mutation(async ({ ctx }) => {
  const secret = otplib.authenticator.generateSecret();
  await setTwoFactorSecret(ctx.user.id, secret);
  const otpauth = otplib.authenticator.keyuri(ctx.user.email, "ShiftFlow", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
  return { secret, qrCode: qrCodeDataUrl };
}),

verify2FAEnable: protectedProcedure
  .input(z.object({ token: z.string().length(6) }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Datenbank nicht erreichbar");
    const result = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    
    const user = result[0];
    if (!user?.twoFactorSecret) throw new Error("Kein Secret vorhanden.");
    const isValid = otplib.authenticator.verify({ token: input.token, secret: user.twoFactorSecret });
    if (!isValid) throw new Error("Ungültiger Code.");
    await enableTwoFactor(user.id);
    return { success: true };
  }),
  
disable2FA: protectedProcedure.mutation(async ({ ctx }) => {
  await disableTwoFactor(ctx.user.id);
  return { success: true };
}),

login2FA: publicProcedure
  .input(z.object({ userId: z.number(), token: z.string().length(6) }))
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Datenbank nicht erreichbar");
    const result = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
    
    const user = result[0];
    if (!user?.twoFactorSecret) throw new Error("2FA nicht eingerichtet.");
    const isValid = otplib.authenticator.verify({ token: input.token, secret: user.twoFactorSecret });
    if (!isValid) throw new Error("Ungültiger Code.");
    const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    await createNotification({ userId: user.id, message: `${user.name ?? "Ein Benutzer"} hat sich angemeldet (2FA).`, type: "info" });
    return { success: true, role: user.role };
  }),

// ── E-Mail-Änderung ─────────────────────────────────────────────────
requestEmailChange: protectedProcedure
  .input(z.object({ newEmail: z.string().email(), currentPassword: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const user = await getUserByOpenId(ctx.user.openId);
    if (!user?.passwordHash) throw new Error("Benutzer nicht gefunden.");
    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new Error("Aktuelles Passwort ist falsch.");
    const token = crypto.randomBytes(32).toString("hex");
    await setPendingEmail(user.id, input.newEmail, token);
    console.log(`[EMAIL CHANGE] Token für ${input.newEmail}: ${token}`);
    return { success: true, message: "Bestätigungscode an neue E-Mail gesendet (Token in Konsole)." };
  }),

confirmEmailChange: protectedProcedure
  .input(z.object({ token: z.string() }))
  .mutation(async ({ ctx, input }) => {
    await confirmEmailChange(ctx.user.id, input.token);
    return { success: true, message: "E-Mail erfolgreich geändert." };
  }),
    login: publicProcedure
  .input(z.object({ email: z.string().email(), password: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // Benutzer aus der DB laden (für die korrekte Rolle)
    const db = await getDb();
    if (!db) throw new Error("Datenbank nicht erreichbar");

    const rows = await db.select().from(users).where(eq(users.openId, input.email)).limit(1);
    const user = rows[0] as any;

    if (!user) throw new Error("Ungültige Email oder Passwort.");

    // Hartcodierter Passwort-Check (temporär)
    if (
      (input.email === 'admin@shiftflow.local' && input.password === 'admin123') ||
      (input.email === 'mitarbeiter2@shiftflow.local' && input.password === 'mitarbeiter123')
    ) {
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });
      return { success: true, role: user.role };   // ← ECHTE Rolle aus der DB
    }

    throw new Error("Ungültige Email oder Passwort.");
  }),
  }),

  // DASHBOARD
  dashboard: router({
    kpis: teamLeaderProcedure.query(async ({ ctx }) => {
      const employees = await getEmployeeCountByStatus(ctx.teamFilter ??"");
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

  // EMPLOYEE
  employee: router({
    list: teamLeaderProcedure.query(({ ctx }) => listEmployees(ctx.teamFilter ??"")),
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

  // MACHINE
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

  // ASSIGNMENT
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

  // NOTIFICATION
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
})