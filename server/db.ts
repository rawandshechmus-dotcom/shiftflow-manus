import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { ENV } from "./_core/env";
import {
  InsertUser,
  users,
  employees,
  machines,
  assignments,
  notifications,
  handovers,
} from "../drizzle/schema";
import {} from "./db";

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

// ── User ─────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'viewer'),
        passwordHash: user.passwordHash ?? null,
        lastSignedIn: user.lastSignedIn ?? new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await db.update(users)
        .set({
          name: user.name ?? existing[0].name,
          email: user.email ?? existing[0].email,
          loginMethod: user.loginMethod ?? existing[0].loginMethod,
          role: user.role ?? existing[0].role,
          lastSignedIn: user.lastSignedIn ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.openId, user.openId));
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

// ── Notifications ────────────────────────────────────────────────────
export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(10);
}

export async function createNotification(notification: any): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(notification);
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(result[0]?.count ?? 0);
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

// ── Dashboard mocks (werden später durch echte DB-Abfragen ersetzt) ──
export async function getEmployeeCountByStatus(_team?: string) {
  return [{ status: "present", count: 24 }];
}
export async function getMachineCountByStatus() {
  return [{ status: "active", count: 12 }, { status: "inactive", count: 3 }];
}
export async function getEfficiency() { return 80; }
export async function getShiftUtilization() { return 92; }
export async function getEmployeeTrend(_team?: string) {
  const days = ["Mo","Di","Mi","Do","Fr","Sa","So"];
  return days.map((day,i) => ({ day, count: 18 + Math.floor(Math.random()*8) + i }));
}
export async function getMachinePerformance() {
  return [
    { name: "Halle 1", utilization: 92 },
    { name: "Halle 2", utilization: 78 },
    { name: "Halle 3", utilization: 85 },
    { name: "Halle 4", utilization: 64 },
    { name: "Halle 5", utilization: 95 },
  ];
}
export async function getActiveIssues() {
  return [
    { id:1, type:"machine" as const, title:"Maschine M-104 – Wartung erforderlich", severity:"warning" as const, since:"Vor 2 Std." },
    { id:2, type:"employee" as const, title:"Lisa Schmidt – Krankmeldung", severity:"error" as const, since:"Vor 4 Std." },
    { id:3, type:"machine" as const, title:"Maschine M-087 – Fehler behoben, warte auf Freigabe", severity:"info" as const, since:"Vor 1 Std." },
  ];
}
export async function getRecentActivities() {
  return [
    { id:1, text:"Maschine M-104 – Status geändert zu Wartung", time:"Vor 5 Minuten", type:"warning" as const },
    { id:2, text:"Max Mustermann – Login um 07:42 Uhr", time:"Vor 12 Minuten", type:"success" as const },
    { id:3, text:"Maschine M-098 – Fehler behoben", time:"Vor 28 Minuten", type:"success" as const },
    { id:4, text:"Lisa Schmidt – Krankmeldung eingereicht", time:"Vor 45 Minuten", type:"error" as const },
    { id:5, text:"Schichtübergabe Früh → Spät abgeschlossen", time:"Vor 1 Stunde", type:"info" as const },
  ];
}

// ── Employees ────────────────────────────────────────────────────────
export async function listEmployees(team?: string) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(employees).where(sql`${employees.deletedAt} IS NULL`);
  if (team) query = db.select().from(employees).where(eq(employees.team, team));
  return await query;
}

export async function createEmployee(data: { firstName: string; lastName: string; personnelNumber: string; team?: string; }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(employees).values(data).returning();
}

export async function updateEmployeeStatus(id: number, status: typeof employees.$inferSelect["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employees).set({ status, updatedAt: new Date() }).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employees).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(employees.id, id));
}

// ── Machines ─────────────────────────────────────────────────────────
export async function listMachines() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(machines).where(sql`${machines.deletedAt} IS NULL`);
}

export async function createMachine(data: { name: string; serialNumber: string; location?: string; }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(machines).values(data).returning();
}

export async function updateMachineStatus(id: number, status: typeof machines.$inferSelect["status"], stopReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(machines).set({ status, stopReason: stopReason || null, updatedAt: new Date() }).where(eq(machines.id, id));
}

export async function deleteMachine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(machines).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(machines.id, id));
}

// ── Assignments / Schichtplan ────────────────────────────────────────
export async function listAssignments(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end   = `${year}-${String(month).padStart(2,'0')}-31`;
  return await db.select().from(assignments)
    .where(sql`${assignments.shiftDate} >= ${start} AND ${assignments.shiftDate} <= ${end}`);
}

export async function createAssignment(data: { employeeId: number; machineId: number; shiftDate: string; shiftType: string; }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(assignments).values(data).returning();
}

export async function deleteAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assignments).where(eq(assignments.id, id));
}

// ★ Neue Funktionen für das Mitarbeiter-Portal ★
export async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getAssignmentsForEmployee(employeeId: number, fromDate: string, toDate: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    // Direktes SQL, um CamelCase/SnakeCase-Probleme endgültig zu vermeiden
    const result = await db.execute(
      sql`SELECT id, employee_id, machine_id, shift_date, shift_type
          FROM assignments
          WHERE employee_id = ${employeeId}
            AND shift_date >= ${fromDate}
            AND shift_date <= ${toDate}
          ORDER BY shift_date`
    );
    // Drizzle gibt `rows` als Array zurück – wir mappen die DB-Spalten auf die Namen, die das Frontend erwartet
    return (result as any).rows.map((row: any) => ({
      id: row.id,
      shiftDate: row.shift_date,      // ← wichtig für den Filter im Portal
      shiftType: row.shift_type,
      employeeId: row.employee_id,
      machineId: row.machine_id,
    }));
  } catch (error) {
    console.error("[DB] getAssignmentsForEmployee failed:", error);
    return [];
  }
}export async function getEmployeeUserId(employeeId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ userId: employees.userId })
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);
  return result[0]?.userId ?? null;
}// Offene Übergaben für eine bestimmte Schicht an einem bestimmten Datum abrufen
export async function listOpenHandovers(shiftType: string, date: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(handovers)
    .where(
      sql`${handovers.toShift} = ${shiftType} AND ${handovers.date} = ${date} AND ${handovers.completed} = false`
    );
}

// Eine Übergabe als erledigt markieren
export async function completeHandover(id: number, completedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(handovers)
    .set({ completed: true, completedBy, updatedAt: new Date() })
    .where(eq(handovers.id, id));
}

// Neue Übergabe anlegen
export async function createHandover(data: { fromShift: string; toShift: string; date: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(handovers).values(data).returning();
}
export async function setTwoFactorSecret(userId: number, secret: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ twoFactorSecret: secret }).where(eq(users.id, userId));
}

export async function enableTwoFactor(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, userId));
}

export async function disableTwoFactor(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null }).where(eq(users.id, userId));
}

// ── E-Mail-Änderung ─────────────────────────────────────────────────
export async function setPendingEmail(userId: number, newEmail: string, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ pendingEmail: newEmail, emailChangeToken: token }).where(eq(users.id, userId));
}

export async function confirmEmailChange(userId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = result[0];
  if (!user || user.emailChangeToken !== token) throw new Error("Ungültiger Bestätigungscode.");
  if (!user.pendingEmail) throw new Error("Keine ausstehende E‑Mail‑Änderung.");
  await db.update(users)
    .set({ email: user.pendingEmail, openId: user.pendingEmail, pendingEmail: null, emailChangeToken: null })
    .where(eq(users.id, userId));
}