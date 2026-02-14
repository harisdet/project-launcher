import { eq, desc, like, or, and, sql, gte, lte, inArray, asc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  customers, InsertCustomer,
  vehicles, InsertVehicle,
  jobCards, InsertJobCard,
  serviceItems, InsertServiceItem,
  parts, InsertPart,
  reminders, InsertReminder,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Customers ───
export async function createCustomer(data: Omit<InsertCustomer, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(data);
  return { id: result[0].insertId };
}

export async function getCustomers(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(customers);
  if (search) {
    return query.where(
      or(
        like(customers.name, `%${search}%`),
        like(customers.phone, `%${search}%`),
        like(customers.email, `%${search}%`)
      )
    ).orderBy(desc(customers.createdAt));
  }
  return query.orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function updateCustomer(id: number, data: Partial<Omit<InsertCustomer, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customers).where(eq(customers.id, id));
}

// ─── Vehicles ───
export async function createVehicle(data: Omit<InsertVehicle, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vehicles).values(data);
  return { id: result[0].insertId };
}

export async function getVehiclesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).where(eq(vehicles.customerId, customerId)).orderBy(desc(vehicles.createdAt));
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result[0];
}

export async function getAllVehicles(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(vehicles).where(
      or(
        like(vehicles.registrationNumber, `%${search}%`),
        like(vehicles.make, `%${search}%`),
        like(vehicles.model, `%${search}%`)
      )
    ).orderBy(desc(vehicles.createdAt));
  }
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
}

export async function updateVehicle(id: number, data: Partial<Omit<InsertVehicle, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

// ─── Job Cards ───
export async function generateJobNumber() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const prefix = `JC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const result = await db.select({ cnt: count() }).from(jobCards);
  const num = (result[0]?.cnt ?? 0) + 1;
  return `${prefix}-${String(num).padStart(4, "0")}`;
}

export async function createJobCard(data: Omit<InsertJobCard, "id" | "createdAt" | "updatedAt" | "jobNumber">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const jobNumber = await generateJobNumber();
  const result = await db.insert(jobCards).values({ ...data, jobNumber });
  return { id: result[0].insertId, jobNumber };
}

export async function getJobCards(filters?: { status?: string; search?: string; vehicleId?: number; customerId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(jobCards.status, filters.status as any));
  }
  if (filters?.vehicleId) {
    conditions.push(eq(jobCards.vehicleId, filters.vehicleId));
  }
  if (filters?.customerId) {
    conditions.push(eq(jobCards.customerId, filters.customerId));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(jobCards.jobNumber, `%${filters.search}%`),
        like(jobCards.description, `%${filters.search}%`)
      )!
    );
  }
  if (conditions.length > 0) {
    return db.select().from(jobCards).where(and(...conditions)).orderBy(desc(jobCards.createdAt));
  }
  return db.select().from(jobCards).orderBy(desc(jobCards.createdAt));
}

export async function getJobCardById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobCards).where(eq(jobCards.id, id)).limit(1);
  return result[0];
}

export async function updateJobCard(id: number, data: Partial<Omit<InsertJobCard, "id" | "createdAt" | "updatedAt" | "jobNumber">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(jobCards).set(data).where(eq(jobCards.id, id));
}

export async function recalcJobCardTotals(jobCardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const laborRows = await db.select({ total: sql<string>`COALESCE(SUM(laborCharge), 0)` }).from(serviceItems).where(eq(serviceItems.jobCardId, jobCardId));
  const partsRows = await db.select({ total: sql<string>`COALESCE(SUM(totalPrice), 0)` }).from(parts).where(eq(parts.jobCardId, jobCardId));
  const totalLabor = laborRows[0]?.total ?? "0";
  const totalParts = partsRows[0]?.total ?? "0";
  const grandTotal = (parseFloat(totalLabor) + parseFloat(totalParts)).toFixed(2);
  await db.update(jobCards).set({ totalLabor, totalParts, grandTotal }).where(eq(jobCards.id, jobCardId));
  return { totalLabor, totalParts, grandTotal };
}

export async function deleteJobCard(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(serviceItems).where(eq(serviceItems.jobCardId, id));
  await db.delete(parts).where(eq(parts.jobCardId, id));
  await db.delete(jobCards).where(eq(jobCards.id, id));
}

// ─── Service Items ───
export async function addServiceItem(data: Omit<InsertServiceItem, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceItems).values(data);
  await recalcJobCardTotals(data.jobCardId);
  return { id: result[0].insertId };
}

export async function getServiceItemsByJobCard(jobCardId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceItems).where(eq(serviceItems.jobCardId, jobCardId));
}

export async function deleteServiceItem(id: number, jobCardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(serviceItems).where(eq(serviceItems.id, id));
  await recalcJobCardTotals(jobCardId);
}

// ─── Parts ───
export async function addPart(data: Omit<InsertPart, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const totalPrice = ((data.quantity ?? 1) * parseFloat(data.unitPrice as string)).toFixed(2);
  const result = await db.insert(parts).values({ ...data, totalPrice });
  await recalcJobCardTotals(data.jobCardId);
  return { id: result[0].insertId };
}

export async function getPartsByJobCard(jobCardId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parts).where(eq(parts.jobCardId, jobCardId));
}

export async function deletePart(id: number, jobCardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(parts).where(eq(parts.id, id));
  await recalcJobCardTotals(jobCardId);
}

// ─── Reminders ───
export async function createReminder(data: Omit<InsertReminder, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reminders).values(data);
  return { id: result[0].insertId };
}

export async function getReminders(filters?: { status?: string; upcoming?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(reminders.status, filters.status as any));
  }
  if (filters?.upcoming) {
    const now = Date.now();
    const thirtyDays = now + 30 * 24 * 60 * 60 * 1000;
    conditions.push(gte(reminders.dueDate, now));
    conditions.push(lte(reminders.dueDate, thirtyDays));
  }
  if (conditions.length > 0) {
    return db.select().from(reminders).where(and(...conditions)).orderBy(asc(reminders.dueDate));
  }
  return db.select().from(reminders).orderBy(asc(reminders.dueDate));
}

export async function updateReminder(id: number, data: Partial<Omit<InsertReminder, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reminders).set(data).where(eq(reminders.id, id));
}

export async function deleteReminder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reminders).where(eq(reminders.id, id));
}

// ─── Dashboard Stats ───
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { pendingJobs: 0, inProgressJobs: 0, completedJobs: 0, totalRevenue: "0", totalCustomers: 0, totalVehicles: 0, recentJobs: [], upcomingReminders: [] };

  const [pendingResult] = await db.select({ cnt: count() }).from(jobCards).where(eq(jobCards.status, "open"));
  const [inProgressResult] = await db.select({ cnt: count() }).from(jobCards).where(eq(jobCards.status, "in-progress"));
  const [completedResult] = await db.select({ cnt: count() }).from(jobCards).where(
    or(eq(jobCards.status, "completed"), eq(jobCards.status, "invoiced"))
  );
  const [revenueResult] = await db.select({
    total: sql<string>`COALESCE(SUM(grandTotal), 0)`
  }).from(jobCards).where(
    or(eq(jobCards.status, "completed"), eq(jobCards.status, "invoiced"))
  );
  const [customerCount] = await db.select({ cnt: count() }).from(customers);
  const [vehicleCount] = await db.select({ cnt: count() }).from(vehicles);

  const recentJobs = await db.select().from(jobCards).orderBy(desc(jobCards.createdAt)).limit(5);

  const now = Date.now();
  const thirtyDays = now + 30 * 24 * 60 * 60 * 1000;
  const upcomingReminders = await db.select().from(reminders)
    .where(and(eq(reminders.status, "pending"), lte(reminders.dueDate, thirtyDays)))
    .orderBy(asc(reminders.dueDate)).limit(5);

  return {
    pendingJobs: pendingResult?.cnt ?? 0,
    inProgressJobs: inProgressResult?.cnt ?? 0,
    completedJobs: completedResult?.cnt ?? 0,
    totalRevenue: revenueResult?.total ?? "0",
    totalCustomers: customerCount?.cnt ?? 0,
    totalVehicles: vehicleCount?.cnt ?? 0,
    recentJobs,
    upcomingReminders,
  };
}

// ─── Service History ───
export async function getServiceHistory(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobCards).where(eq(jobCards.vehicleId, vehicleId)).orderBy(desc(jobCards.createdAt));
}

// ─── Invoice Data ───
export async function getInvoiceData(jobCardId: number) {
  const db = await getDb();
  if (!db) return null;
  const [job] = await db.select().from(jobCards).where(eq(jobCards.id, jobCardId)).limit(1);
  if (!job) return null;
  const [customer] = await db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1);
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, job.vehicleId)).limit(1);
  const services = await db.select().from(serviceItems).where(eq(serviceItems.jobCardId, jobCardId));
  const partsList = await db.select().from(parts).where(eq(parts.jobCardId, jobCardId));
  return { job, customer, vehicle, services, parts: partsList };
}
