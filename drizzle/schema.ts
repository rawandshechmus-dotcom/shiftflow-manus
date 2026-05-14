import { pgTable, serial, integer, text, varchar, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// Enum-Typen
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "sick", "vacation", "absent"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 10 }).default("user").notNull(),
  passwordHash: text("password_hash"),
  team: varchar("team", { length: 100 }),
  // Neue Spalten für 2FA und E-Mail-Änderung
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  pendingEmail: text("pending_email"),
  emailChangeToken: text("email_change_token"),
  // Bestehende Spalten
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  personnelNumber: varchar("personnel_number", { length: 50 }).notNull().unique(),
  team: varchar("team", { length: 100 }),
  userId: integer("user_id").references(() => users.id),
  status: attendanceStatusEnum("status").default("present").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),
  location: varchar("location", { length: 200 }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  stopReason: text("stop_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  machineId: integer("machine_id").notNull().references(() => machines.id),
  shiftDate: varchar("shift_date", { length: 10 }).notNull(),
  shiftType: varchar("shift_type", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const handovers = pgTable("handovers", {
  id: serial("id").primaryKey(),
  fromShift: varchar("from_shift", { length: 10 }).notNull(),
  toShift: varchar("to_shift", { length: 10 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  notes: text("notes"),
  completed: boolean("completed").default(false).notNull(),
  completedBy: integer("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Typ-Exporte
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

