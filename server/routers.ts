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
} from "./db";
import { COOKIE_NAME, getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

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
        totalMachines:
          machines.reduce((acc, m) => acc + m.count, 0) ?? 0,
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

  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => listNotifications(ctx.user.id)),
    unreadCount: protectedProcedure
      .input(z.object({}).optional())
      .query(async ({ ctx }) => getUnreadNotificationCount(ctx.user.id)),
    markAsRead: protectedProcedure
    .input(z.number())
    .mutation(async({ input, ctx }) => {await markNotificationAsRead(input, ctx.user.id);
      return { success: true } 
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

