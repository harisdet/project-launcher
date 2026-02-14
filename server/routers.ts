import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Customers ───
  customer: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ input }) => db.getCustomers(input?.search)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getCustomerById(input.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(({ input }) => db.createCustomer(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        phone: z.string().min(1).optional(),
        email: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateCustomer(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteCustomer(input.id)),
  }),

  // ─── Vehicles ───
  vehicle: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ input }) => db.getAllVehicles(input?.search)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getVehicleById(input.id)),

    byCustomer: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(({ input }) => db.getVehiclesByCustomer(input.customerId)),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        registrationNumber: z.string().min(1),
        vehicleType: z.enum(["2-wheeler", "4-wheeler"]),
        make: z.string().min(1),
        model: z.string().min(1),
        year: z.number().optional(),
        color: z.string().optional(),
      }))
      .mutation(({ input }) => db.createVehicle(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        registrationNumber: z.string().min(1).optional(),
        vehicleType: z.enum(["2-wheeler", "4-wheeler"]).optional(),
        make: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
        year: z.number().optional(),
        color: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateVehicle(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteVehicle(input.id)),
  }),

  // ─── Job Cards ───
  jobCard: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        vehicleId: z.number().optional(),
        customerId: z.number().optional(),
      }).optional())
      .query(({ input }) => db.getJobCards(input)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getJobCardById(input.id)),

    create: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        customerId: z.number(),
        description: z.string().optional(),
        odometerReading: z.number().optional(),
        estimatedTotal: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => db.createJobCard(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["open", "in-progress", "completed", "invoiced", "cancelled"]).optional(),
        description: z.string().optional(),
        odometerReading: z.number().optional(),
        estimatedTotal: z.string().optional(),
        notes: z.string().optional(),
        completedAt: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        // Auto-set completedAt when status changes to completed
        if (data.status === "completed" && !data.completedAt) {
          data.completedAt = new Date();
        }
        return db.updateJobCard(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteJobCard(input.id)),

    // Service history for a vehicle
    serviceHistory: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(({ input }) => db.getServiceHistory(input.vehicleId)),

    // Invoice data
    invoiceData: protectedProcedure
      .input(z.object({ jobCardId: z.number() }))
      .query(({ input }) => db.getInvoiceData(input.jobCardId)),
  }),

  // ─── Service Items ───
  serviceItem: router({
    list: protectedProcedure
      .input(z.object({ jobCardId: z.number() }))
      .query(({ input }) => db.getServiceItemsByJobCard(input.jobCardId)),

    add: protectedProcedure
      .input(z.object({
        jobCardId: z.number(),
        description: z.string().min(1),
        laborCharge: z.string(),
      }))
      .mutation(({ input }) => db.addServiceItem(input)),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), jobCardId: z.number() }))
      .mutation(({ input }) => db.deleteServiceItem(input.id, input.jobCardId)),
  }),

  // ─── Parts ───
  part: router({
    list: protectedProcedure
      .input(z.object({ jobCardId: z.number() }))
      .query(({ input }) => db.getPartsByJobCard(input.jobCardId)),

    add: protectedProcedure
      .input(z.object({
        jobCardId: z.number(),
        name: z.string().min(1),
        partNumber: z.string().optional(),
        quantity: z.number().min(1),
        unitPrice: z.string(),
        totalPrice: z.string(),
      }))
      .mutation(({ input }) => db.addPart(input)),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), jobCardId: z.number() }))
      .mutation(({ input }) => db.deletePart(input.id, input.jobCardId)),
  }),

  // ─── Reminders ───
  reminder: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        upcoming: z.boolean().optional(),
      }).optional())
      .query(({ input }) => db.getReminders(input)),

    create: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        customerId: z.number(),
        jobCardId: z.number().optional(),
        reminderType: z.string().min(1),
        dueDate: z.number(),
        message: z.string().optional(),
      }))
      .mutation(({ input }) => db.createReminder(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "sent", "dismissed"]).optional(),
        dueDate: z.number().optional(),
        message: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateReminder(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteReminder(input.id)),
  }),

  // ─── Dashboard ───
  dashboard: router({
    stats: protectedProcedure.query(() => db.getDashboardStats()),
  }),
});

export type AppRouter = typeof appRouter;
