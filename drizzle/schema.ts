import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Customers table
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// Vehicles table
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  registrationNumber: varchar("registrationNumber", { length: 20 }).notNull(),
  vehicleType: mysqlEnum("vehicleType", ["2-wheeler", "4-wheeler"]).notNull(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year"),
  color: varchar("color", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// Job Cards table
export const jobCards = mysqlTable("jobCards", {
  id: int("id").autoincrement().primaryKey(),
  jobNumber: varchar("jobNumber", { length: 20 }).notNull().unique(),
  vehicleId: int("vehicleId").notNull(),
  customerId: int("customerId").notNull(),
  status: mysqlEnum("status", ["open", "in-progress", "completed", "invoiced", "cancelled"]).default("open").notNull(),
  description: text("description"),
  odometerReading: int("odometerReading"),
  estimatedTotal: decimal("estimatedTotal", { precision: 10, scale: 2 }).default("0.00"),
  totalLabor: decimal("totalLabor", { precision: 10, scale: 2 }).default("0.00"),
  totalParts: decimal("totalParts", { precision: 10, scale: 2 }).default("0.00"),
  grandTotal: decimal("grandTotal", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type JobCard = typeof jobCards.$inferSelect;
export type InsertJobCard = typeof jobCards.$inferInsert;

// Service Items (labor line items per job card)
export const serviceItems = mysqlTable("serviceItems", {
  id: int("id").autoincrement().primaryKey(),
  jobCardId: int("jobCardId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  laborCharge: decimal("laborCharge", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServiceItem = typeof serviceItems.$inferSelect;
export type InsertServiceItem = typeof serviceItems.$inferInsert;

// Parts used per job card
export const parts = mysqlTable("parts", {
  id: int("id").autoincrement().primaryKey(),
  jobCardId: int("jobCardId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  partNumber: varchar("partNumber", { length: 100 }),
  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Part = typeof parts.$inferSelect;
export type InsertPart = typeof parts.$inferInsert;

// Reminders table
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  customerId: int("customerId").notNull(),
  jobCardId: int("jobCardId"),
  reminderType: varchar("reminderType", { length: 100 }).notNull(),
  dueDate: bigint("dueDate", { mode: "number" }).notNull(), // UTC ms timestamp
  message: text("message"),
  status: mysqlEnum("status", ["pending", "sent", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;
