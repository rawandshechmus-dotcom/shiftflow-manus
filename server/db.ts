import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  InsertNotification,
  InsertUser,
  notifications,
  users,
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };

    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      const value = user[field];
      if (value !== undefined) {
        values[field] = value ?? null;
      }
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: sql`excluded.name`,
          email: sql`excluded.email`,
          loginMethod: sql`excluded.loginMethod`,
          role: sql`excluded.role`,
          lastSignedIn: sql`excluded.lastSignedIn`,
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0] || undefined;
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list notifications: database not available");
    return [];
  }

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(10);
}

export async function createNotification(
  notification: InsertNotification
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return;
  }

  await db.insert(notifications).values(notification);
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark notification as read: database not available");
    return;
  }

  await db
    .update(notifications)
    .set({
      isRead: true,
      createdAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot count unread notifications: database not available");
    return 0;
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return Number(result[0]?.count ?? 0);
}

// ── Dashboard mocks (unchanged)
export async function getEmployeeCountByStatus(_team?: string) {
  return [{ status: "present", count: 24 }];
}

// ... (all dashboard functions unchanged, as per previous content)
export async function getMachineCountByStatus() {
  return [
    { status: "active", count: 12 },
    { status: "inactive", count: 3 },
  ];
}

export async function getEfficiency() {
  return 80;
}

export async function getShiftUtilization() {
  return 92;
}

export async function getEmployeeTrend(_team?: string) {
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  return days.map((day, i) => ({
    day,
    count: 18 + Math.floor(Math.random() * 8) + i,
  }));
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
    {
      id: 1,
      type: "machine" as const,
      title: "Maschine M-104 - Wartung erforderlich",
      severity: "warning" as const,
      since: "Vor 2 Std.",
    },
    {
      id: 2,
      type: "employee" as const,
      title: "Lisa Schmidt - Krankmeldung",
      severity: "error" as const,
      since: "Vor 4 Std.",
    },
    {
      id: 3,
      type: "machine" as const,
      title: "Maschine M-087 - Fehler behoben, warte auf Freigabe",
      severity: "info" as const,
      since: "Vor 1 Std.",
    },
  ];
}

export async function getRecentActivities() {
  return [
    {
      id: 1,
      text: "Maschine M-104 - Status geändert zu Wartung",
      time: "Vor 5 Minuten",
      type: "warning" as const,
    },
    {
      id: 2,
      text: "Max Mustermann - Login um 07:42 Uhr",
      time: "Vor 12 Minuten",
      type: "success" as const,
    },
    {
      id: 3,
      text: "Maschine M-098 - Fehler behoben",
      time: "Vor 28 Minuten",
      type: "success" as const,
    },
    {
      id: 4,
      text: "Lisa Schmidt - Krankmeldung eingereicht",
      time: "Vor 45 Minuten",
      type: "error" as const,
    },
    {
      id: 5,
      text: "Schichtübergabe Früh -> Spät abgeschlossen",
      time: "Vor 1 Stunde",
      type: "info" as const,
    },
  ];
}

