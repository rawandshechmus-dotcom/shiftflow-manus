import { pgTable, serial, text, timestamp, integer, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";

// ==================== ENUMS ====================
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "operator", "viewer"]);
export const machineStatusEnum = pgEnum("machine_status", ["active", "inactive", "maintenance"]);
export const employeeStatusEnum = pgEnum("employee_status", ["present", "absent", "vacation", "leave"]);
export const issuePriorityEnum = pgEnum("issue_priority", ["low", "medium", "high", "critical"]);
export const issueStatusEnum = pgEnum("issue_status", ["open", "in_progress", "resolved", "closed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["info", "success", "warning", "error"]);

// ==================== USERS (bereits vorhanden – erweitert) ====================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("open_id").notNull().unique(),
  email: text("email"),
  name: text("name"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").default("operator"),
  loginMethod: text("login_method"),
  lastSignedIn: timestamp("last_signed_in").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// ==================== EMPLOYEES ====================
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
// ==================== MACHINES ====================
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: machineStatusEnum("status").default("active"),
  location: text("location"),
  lastMaintenance: timestamp("last_maintenance"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== ISSUES ====================
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priority: issuePriorityEnum("priority").default("medium"),
  status: issueStatusEnum("status").default("open"),
  reportedBy: integer("reported_by").references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  machineId: integer("machine_id").references(() => machines.id),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// ==================== ACTIVITIES (wichtig für recentActivities) ====================
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // z.B. "login", "update_machine", "create_issue"
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== NOTIFICATIONS ====================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").default("info"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== SHIFTS (für Auslastung) ====================
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  date: timestamp("date").notNull(),
  plannedHours: decimal("planned_hours", { precision: 5, scale: 2 }).default("0"),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== PERFORMANCE LOGS (für Effizienz & OEE) ====================
export const performanceLogs = pgTable("performance_logs", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id),
  output: integer("output").default(0),      // produzierte Einheiten
  target: integer("target").default(0),       // Soll-Einheiten
  availability: decimal("availability", { precision: 5, scale: 2 }).default("0"),
  performance: decimal("performance", { precision: 5, scale: 2 }).default("0"),
  quality: decimal("quality", { precision: 5, scale: 2 }).default("0"),
  oee: decimal("oee", { precision: 5, scale: 2 }).default("0"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // für Soft-Delete
});