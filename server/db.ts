import { eq, desc, and, sql, count, gte, lte, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  InsertUser,
  users,
  // Annahme: Du hast diese Tabellen in deinem Schema
  employees,
  machines,
  issues,
  activities,
  notifications,
  shifts,
  performanceLogs,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER-Funktionen (bereits vorhanden) ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  // ... (dein bestehender Code, unverändert) ...
}
export async function getUserByOpenId(openId: string) {
  // ... (dein bestehender Code, unverändert) ...
}

// ==================== DASHBOARD-Funktionen ====================

export async function getEmployeeCountByStatus() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      status: employees.status,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .groupBy(employees.status);
}

export async function getMachineCountByStatus() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      status: machines.status, // z.B. 'active', 'inactive', 'maintenance'
      count: sql<number>`count(*)`,
    })
    .from(machines)
    .groupBy(machines.status);
}

export async function getEfficiency() {
  const db = await getDb();
  if (!db) return 0;
  // Beispiel: Berechnung der Gesamteffizienz (z.B. produzierte Einheiten / Soll)
  const result = await db
    .select({
      totalOutput: sql<number>`sum(${performanceLogs.output})`,
      totalTarget: sql<number>`sum(${performanceLogs.target})`,
    })
    .from(performanceLogs)
    .where(
      and(
        gte(performanceLogs.date, sql`now() - interval '7 days'`),
        isNull(performanceLogs.deletedAt)
      )
    );
  if (result.length === 0 || result[0].totalTarget === 0) return 0;
  return (result[0].totalOutput / result[0].totalTarget) * 100;
}

export async function getShiftUtilization() {
  const db = await getDb();
  if (!db) return 0;
  // Beispiel: Auslastung basierend auf geplanten vs. tatsächlichen Stunden
  const result = await db
    .select({
      planned: sql<number>`sum(${shifts.plannedHours})`,
      actual: sql<number>`sum(${shifts.actualHours})`,
    })
    .from(shifts)
    .where(gte(shifts.date, sql`now() - interval '30 days'`));
  if (result.length === 0 || result[0].planned === 0) return 0;
  return (result[0].actual / result[0].planned) * 100;
}

export async function getEmployeeTrend(team?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = team ? eq(employees.team, team) : undefined;
  // Trend: Anzahl Mitarbeiter pro Monat (letzte 6 Monate)
  return db
    .select({
      month: sql<string>`to_char(${employees.hireDate}, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(conditions)
    .groupBy(sql`month`)
    .orderBy(sql`month`);
}

export async function getMachinePerformance() {
  const db = await getDb();
  if (!db) return [];
  // OEE-ähnliche Metriken pro Maschine
  return db
    .select({
      machineId: machines.id,
      machineName: machines.name,
      availability: sql<number>`avg(${performanceLogs.availability})`,
      performance: sql<number>`avg(${performanceLogs.performance})`,
      quality: sql<number>`avg(${performanceLogs.quality})`,
      oee: sql<number>`avg(${performanceLogs.oee})`,
    })
    .from(performanceLogs)
    .innerJoin(machines, eq(performanceLogs.machineId, machines.id))
    .groupBy(machines.id, machines.name);
}

export async function getActiveIssues() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(issues)
    .where(and(eq(issues.status, "open"), isNull(issues.resolvedAt)))
    .orderBy(desc(issues.priority), desc(issues.createdAt));
}

export async function getRecentActivities(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activities)
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

// ==================== NOTIFICATION-Funktionen ====================

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: {
  message: string;
  type: "info" | "success" | "warning" | "error";
  userId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notifications).values({
    ...data,
    createdAt: new Date(),
    isRead: false,
  });
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
  return result[0]?.value ?? 0;
}
xport async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  return result[0] ?? null;
}

// Schichten für einen Mitarbeiter (heute + nächste 7 Tage)
export async function getAssignmentsForEmployee(employeeId: number, fromDate: string, toDate: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assignments)
    .where(sql`${assignments.employeeId} = ${employeeId} AND ${assignments.shiftDate} >= ${fromDate} AND ${assignments.shiftDate} <= ${toDate}`);
}
xport async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getAssignmentsForEmployee(employeeId: number, fromDate: string, toDate: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assignments)
    .where(sql`${assignments.employeeId} = ${employeeId} AND ${assignments.shiftDate} >= ${fromDate} AND ${assignments.shiftDate} <= ${toDate}`);
}