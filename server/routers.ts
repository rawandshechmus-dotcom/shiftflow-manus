import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
  listEmployees,
  createEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  listMachines,
  createMachine,
  updateMachineStatus,
  deleteMachine,
  getUserByOpenId,
  listAssignments,
  createAssignment,
  deleteAssignment,
  getEmployeeByUserId,
  getAssignmentsForEmployee,
} from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  
  // AUTH
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (input.email === "admin@shiftflow.local" && input.password === "admin123") {
          const sessionToken = await sdk.createSessionToken(input.email, {
            name: "Administrator",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS,
          });

          // --- Trigger: Login-Benachrichtigung ---
          const adminUser = await getUserByOpenId(input.email);
          if (adminUser) {
            await createNotification({
              userId: adminUser.id,
              message: `${adminUser.name ?? "Ein Benutzer"} hat sich angemeldet.`,
              type: "info",
            });
          }
          return { success: true };
        }
        throw new Error("Ungültige Email oder Passwort.");
      }),
  }),

  // DASHBOARD
  dashboard: router({
    kpis: protectedProcedure.query(async () => {
      const employees = await getEmployeeCountByStatus();
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

    employeeTrend: protectedProcedure
      .input(z.object({ team: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getEmployeeTrend(input?.team);
      }),

    machinePerformance: protectedProcedure.query(async () => {
      return getMachinePerformance();
    }),

    activeIssues: protectedProcedure.query(async () => {
      return getActiveIssues();
    }),

    recentActivities: protectedProcedure.query(async () => {
      return getRecentActivities();
    }),
  }),

  // EMPLOYEE
  employee: router({
    list: publicProcedure.query(async () => {
      return await listEmployees();
    }),
    create: publicProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        personnelNumber: z.string().min(1),
        team: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const newEmployee = await createEmployee(input);
        // --- Trigger: Neuer Mitarbeiter ---
        await createNotification({
          userId: ctx.user?.id ?? newEmployee[0]?.id,
          message: `Mitarbeiter ${input.firstName} ${input.lastName} wurde angelegt.`,
          type: "success",
        });
        return newEmployee;
      }),
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["present", "sick", "vacation", "absent"]),
      }))
      .mutation(async ({ input }) => {
        await updateEmployeeStatus(input.id, input.status);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Mitarbeiter vor dem Löschen abrufen
        const allEmployees = await listEmployees();
        const emp = allEmployees.find(e => e.id === input.id);
        await deleteEmployee(input.id);
        // --- Trigger: Mitarbeiter gelöscht ---
        if (emp) {
          await createNotification({
            userId: ctx.user?.id ?? emp.id,
            message: `Mitarbeiter ${emp.firstName} ${emp.lastName} wurde entfernt.`,
            type: "error",
          });
        }
        return { success: true };
      }),
      me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return null;
      const emp = await getEmployeeByUserId(ctx.user.id);
      if (!emp) return null;
       // Schichten für heute + 7 Tage
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const shifts = await getAssignmentsForEmployee(emp.id, today, nextWeek);
      return { ...emp, shifts };
      }),
  }),

  // MACHINE
  machine: router({
    list: publicProcedure.query(async () => {
      return await listMachines();
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        serialNumber: z.string().min(1),
        location: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const newMachine = await createMachine(input);
        // --- Trigger: Neue Maschine ---
        await createNotification({
          userId: ctx.user?.id,
          message: `Maschine ${input.name} wurde hinzugefügt.`,
          type: "success",
        });
        return newMachine;
      }),
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "inactive", "maintenance", "error"]),
        stopReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateMachineStatus(input.id, input.status, input.stopReason);
        // --- Trigger: Maschinen-Statusänderung ---
        if (input.stopReason) {
          await createNotification({
            userId: ctx.user?.id,
            message: `Maschine (ID ${input.id}) auf ${input.status} gesetzt (Grund: ${input.stopReason}).`,
            type: "warning",
          });
        }
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMachine(input.id);
        return { success: true };
      }),
  }),

  // ASSIGNMENT (Schichtzuweisung)
  assignment: router({
    list: publicProcedure
      .input(z.object({ year: z.number(), month: z.number() }).optional())
      .query(async ({ input }) => {
        const now = new Date();
        const year = input?.year ?? now.getFullYear();
        const month = input?.month ?? now.getMonth() + 1;
        return await listAssignments(year, month);
      }),
    create: publicProcedure
      .input(z.object({
        employeeId: z.number(),
        machineId: z.number(),
        shiftDate: z.string(),
        shiftType: z.enum(["early", "late", "night"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const newAssignment = await createAssignment(input);
        // --- Trigger: Schichtzuweisung erstellt ---
        await createNotification({
          userId: ctx.user?.id,
          message: `Neue Schichtzuweisung: Mitarbeiter ${input.employeeId} auf Maschine ${input.machineId} (${input.shiftType}).`,
          type: "info",
        });
        return newAssignment;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAssignment(input.id);
        return { success: true };
      }),
  }),
  // NOTIFICATION
  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => listNotifications(ctx.user.id)),
    unreadCount: protectedProcedure
      .input(z.object({}).optional())
      .query(async ({ ctx }) => getUnreadNotificationCount(ctx.user.id)),
    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        await markNotificationAsRead(input, ctx.user.id);
        return { success: true };
      }),
    create: protectedProcedure
      .input(z.object({
        message: z.string().min(1),
        type: z.enum(["info", "success", "warning", "error"]),
      }))
      .mutation(async ({ input, ctx }) => {
        await createNotification({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;