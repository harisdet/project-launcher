import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => {
  return {
    getCustomers: vi.fn().mockResolvedValue([
      { id: 1, name: "Rajesh Kumar", phone: "9876543210", email: "rajesh@test.com", address: "Mumbai", createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "Priya Sharma", phone: "9876543211", email: null, address: null, createdAt: new Date(), updatedAt: new Date() },
    ]),
    getCustomerById: vi.fn().mockResolvedValue(
      { id: 1, name: "Rajesh Kumar", phone: "9876543210", email: "rajesh@test.com", address: "Mumbai", createdAt: new Date(), updatedAt: new Date() }
    ),
    createCustomer: vi.fn().mockResolvedValue({ id: 3 }),
    updateCustomer: vi.fn().mockResolvedValue(undefined),
    deleteCustomer: vi.fn().mockResolvedValue(undefined),

    getAllVehicles: vi.fn().mockResolvedValue([
      { id: 1, customerId: 1, registrationNumber: "MH01AB1234", vehicleType: "4-wheeler", make: "Honda", model: "City", year: 2023, color: "White", createdAt: new Date(), updatedAt: new Date() },
    ]),
    getVehicleById: vi.fn().mockResolvedValue(
      { id: 1, customerId: 1, registrationNumber: "MH01AB1234", vehicleType: "4-wheeler", make: "Honda", model: "City", year: 2023, color: "White", createdAt: new Date(), updatedAt: new Date() }
    ),
    getVehiclesByCustomer: vi.fn().mockResolvedValue([
      { id: 1, customerId: 1, registrationNumber: "MH01AB1234", vehicleType: "4-wheeler", make: "Honda", model: "City", year: 2023, color: "White", createdAt: new Date(), updatedAt: new Date() },
    ]),
    createVehicle: vi.fn().mockResolvedValue({ id: 2 }),
    updateVehicle: vi.fn().mockResolvedValue(undefined),
    deleteVehicle: vi.fn().mockResolvedValue(undefined),

    getJobCards: vi.fn().mockResolvedValue([
      { id: 1, jobNumber: "JC202602-0001", vehicleId: 1, customerId: 1, status: "open", description: "Oil change", totalLabor: "500", totalParts: "300", grandTotal: "800", createdAt: new Date(), updatedAt: new Date() },
    ]),
    getJobCardById: vi.fn().mockResolvedValue(
      { id: 1, jobNumber: "JC202602-0001", vehicleId: 1, customerId: 1, status: "open", description: "Oil change", odometerReading: 45000, totalLabor: "500", totalParts: "300", grandTotal: "800", notes: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() }
    ),
    createJobCard: vi.fn().mockResolvedValue({ id: 2, jobNumber: "JC202602-0002" }),
    updateJobCard: vi.fn().mockResolvedValue(undefined),
    deleteJobCard: vi.fn().mockResolvedValue(undefined),
    getServiceHistory: vi.fn().mockResolvedValue([
      { id: 1, jobNumber: "JC202602-0001", status: "completed", description: "Oil change", grandTotal: "800", createdAt: new Date() },
    ]),
    getInvoiceData: vi.fn().mockResolvedValue({
      job: { id: 1, jobNumber: "JC202602-0001", vehicleId: 1, customerId: 1, status: "completed", totalLabor: "500", totalParts: "300", grandTotal: "800", createdAt: new Date() },
      customer: { id: 1, name: "Rajesh Kumar", phone: "9876543210" },
      vehicle: { id: 1, registrationNumber: "MH01AB1234", make: "Honda", model: "City" },
      services: [{ id: 1, description: "Oil change", laborCharge: "500" }],
      parts: [{ id: 1, name: "Oil Filter", quantity: 1, unitPrice: "300", totalPrice: "300" }],
    }),

    getServiceItemsByJobCard: vi.fn().mockResolvedValue([
      { id: 1, jobCardId: 1, description: "Oil change", laborCharge: "500", createdAt: new Date() },
    ]),
    addServiceItem: vi.fn().mockResolvedValue({ id: 2 }),
    deleteServiceItem: vi.fn().mockResolvedValue(undefined),

    getPartsByJobCard: vi.fn().mockResolvedValue([
      { id: 1, jobCardId: 1, name: "Oil Filter", partNumber: "OF-123", quantity: 1, unitPrice: "300", totalPrice: "300", createdAt: new Date() },
    ]),
    addPart: vi.fn().mockResolvedValue({ id: 2 }),
    deletePart: vi.fn().mockResolvedValue(undefined),

    getReminders: vi.fn().mockResolvedValue([
      { id: 1, vehicleId: 1, customerId: 1, reminderType: "Oil Change", dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, status: "pending", message: "Next oil change due", createdAt: new Date() },
    ]),
    createReminder: vi.fn().mockResolvedValue({ id: 2 }),
    updateReminder: vi.fn().mockResolvedValue(undefined),
    deleteReminder: vi.fn().mockResolvedValue(undefined),

    getDashboardStats: vi.fn().mockResolvedValue({
      pendingJobs: 3,
      inProgressJobs: 2,
      completedJobs: 15,
      totalRevenue: "45000",
      totalCustomers: 10,
      totalVehicles: 12,
      recentJobs: [
        { id: 1, jobNumber: "JC202602-0001", status: "open", description: "Oil change", createdAt: new Date() },
      ],
      upcomingReminders: [
        { id: 1, reminderType: "Oil Change", dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, status: "pending" },
      ],
    }),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Customer procedures", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  it("lists all customers", async () => {
    const result = await caller.customer.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Rajesh Kumar");
  });

  it("lists customers with search filter", async () => {
    const result = await caller.customer.list({ search: "Rajesh" });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets customer by id", async () => {
    const result = await caller.customer.getById({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.name).toBe("Rajesh Kumar");
    expect(result?.phone).toBe("9876543210");
  });

  it("creates a new customer", async () => {
    const result = await caller.customer.create({
      name: "New Customer",
      phone: "9876543212",
      email: "new@test.com",
    });
    expect(result).toEqual({ id: 3 });
  });

  it("updates a customer", async () => {
    await expect(
      caller.customer.update({ id: 1, name: "Updated Name" })
    ).resolves.not.toThrow();
  });

  it("deletes a customer", async () => {
    await expect(
      caller.customer.delete({ id: 1 })
    ).resolves.not.toThrow();
  });

  it("rejects create with empty name", async () => {
    await expect(
      caller.customer.create({ name: "", phone: "123" })
    ).rejects.toThrow();
  });
});

describe("Vehicle procedures", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  it("lists all vehicles", async () => {
    const result = await caller.vehicle.list();
    expect(result).toHaveLength(1);
    expect(result[0].registrationNumber).toBe("MH01AB1234");
  });

  it("gets vehicle by id", async () => {
    const result = await caller.vehicle.getById({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.make).toBe("Honda");
    expect(result?.model).toBe("City");
  });

  it("gets vehicles by customer", async () => {
    const result = await caller.vehicle.byCustomer({ customerId: 1 });
    expect(result).toHaveLength(1);
  });

  it("creates a vehicle", async () => {
    const result = await caller.vehicle.create({
      customerId: 1,
      registrationNumber: "MH02CD5678",
      vehicleType: "2-wheeler",
      make: "Honda",
      model: "Activa",
      year: 2024,
    });
    expect(result).toEqual({ id: 2 });
  });

  it("validates vehicle type enum", async () => {
    await expect(
      caller.vehicle.create({
        customerId: 1,
        registrationNumber: "MH02CD5678",
        vehicleType: "3-wheeler" as any,
        make: "Auto",
        model: "Rickshaw",
      })
    ).rejects.toThrow();
  });
});

describe("Job Card procedures", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  it("lists job cards", async () => {
    const result = await caller.jobCard.list();
    expect(result).toHaveLength(1);
    expect(result[0].jobNumber).toBe("JC202602-0001");
  });

  it("lists job cards with status filter", async () => {
    const result = await caller.jobCard.list({ status: "open" });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets job card by id", async () => {
    const result = await caller.jobCard.getById({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.status).toBe("open");
    expect(result?.odometerReading).toBe(45000);
  });

  it("creates a job card", async () => {
    const result = await caller.jobCard.create({
      vehicleId: 1,
      customerId: 1,
      description: "General service",
    });
    expect(result.id).toBe(2);
    expect(result.jobNumber).toBe("JC202602-0002");
  });

  it("updates job card status", async () => {
    await expect(
      caller.jobCard.update({ id: 1, status: "in-progress" })
    ).resolves.not.toThrow();
  });

  it("validates status enum", async () => {
    await expect(
      caller.jobCard.update({ id: 1, status: "invalid" as any })
    ).rejects.toThrow();
  });

  it("deletes a job card", async () => {
    await expect(
      caller.jobCard.delete({ id: 1 })
    ).resolves.not.toThrow();
  });

  it("gets service history for a vehicle", async () => {
    const result = await caller.jobCard.serviceHistory({ vehicleId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("completed");
  });

  it("gets invoice data", async () => {
    const result = await caller.jobCard.invoiceData({ jobCardId: 1 });
    expect(result).toBeDefined();
    expect(result?.job.jobNumber).toBe("JC202602-0001");
    expect(result?.customer.name).toBe("Rajesh Kumar");
    expect(result?.vehicle.registrationNumber).toBe("MH01AB1234");
    expect(result?.services).toHaveLength(1);
    expect(result?.parts).toHaveLength(1);
  });
});

describe("Service Item procedures", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  it("lists service items for a job card", async () => {
    const result = await caller.serviceItem.list({ jobCardId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Oil change");
  });

  it("adds a service item", async () => {
    const result = await caller.serviceItem.add({
      jobCardId: 1,
      description: "Brake pad replacement",
      laborCharge: "800",
    });
    expect(result).toEqual({ id: 2 });
  });

  it("rejects service item with empty description", async () => {
    await expect(
      caller.serviceItem.add({
        jobCardId: 1,
        description: "",
        laborCharge: "500",
      })
    ).rejects.toThrow();
  });

  it("deletes a service item", async () => {
    await expect(
      caller.serviceItem.delete({ id: 1, jobCardId: 1 })
    ).resolves.not.toThrow();
  });
});

describe("Part procedures", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  it("lists parts for a job card", async () => {
    const result = await caller.part.list({ jobCardId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Oil Filter");
  });

  it("adds a part", async () => {
    const result = await caller.part.add({
      jobCardId: 1,
      name: "Brake Pad",
      partNumber: "BP-456",
      quantity: 2,
      unitPrice: "400",
      totalPrice: "800",
    });
    expect(result).toEqual({ id: 2 });
  });

  it("rejects part with zero quantity", async () => {
    await expect(
      caller.part.add({
        jobCardId: 1,
        name: "Test",
        quantity: 0,
        unitPrice: "100",
        totalPrice: "0",
      })
    ).rejects.toThrow();
  });

  it("deletes a part", async () => {
    await expect(
      caller.part.delete({ id: 1, jobCardId: 1 })
    ).resolves.not.toThrow();
  });
});

describe("Reminder procedures", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  it("lists reminders", async () => {
    const result = await caller.reminder.list();
    expect(result).toHaveLength(1);
    expect(result[0].reminderType).toBe("Oil Change");
  });

  it("lists reminders with status filter", async () => {
    const result = await caller.reminder.list({ status: "pending" });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a reminder", async () => {
    const result = await caller.reminder.create({
      vehicleId: 1,
      customerId: 1,
      reminderType: "General Service",
      dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      message: "Next service due",
    });
    expect(result).toEqual({ id: 2 });
  });

  it("updates reminder status", async () => {
    await expect(
      caller.reminder.update({ id: 1, status: "sent" })
    ).resolves.not.toThrow();
  });

  it("validates reminder status enum", async () => {
    await expect(
      caller.reminder.update({ id: 1, status: "invalid" as any })
    ).rejects.toThrow();
  });

  it("deletes a reminder", async () => {
    await expect(
      caller.reminder.delete({ id: 1 })
    ).resolves.not.toThrow();
  });
});

describe("Dashboard procedures", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  it("returns dashboard stats", async () => {
    const result = await caller.dashboard.stats();
    expect(result.pendingJobs).toBe(3);
    expect(result.inProgressJobs).toBe(2);
    expect(result.completedJobs).toBe(15);
    expect(result.totalRevenue).toBe("45000");
    expect(result.totalCustomers).toBe(10);
    expect(result.totalVehicles).toBe(12);
    expect(result.recentJobs).toHaveLength(1);
    expect(result.upcomingReminders).toHaveLength(1);
  });
});
