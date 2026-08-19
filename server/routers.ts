import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getActiveFareRules, getAdminSettings, insertFareQuote, insertLedgerEntries, insertRideflowFile, getRideflowProfile, transferAdminToEmail, updateAdminSettings, updateFareRules, upsertRideflowProfile } from "./db";
import { calculateRideflowFare } from "./fare";
import { storagePut } from "./storage";

const uploadPurpose = z.enum(["profile_photo", "driver_license", "insurance", "vehicle_document", "lost_item"]);
const acceptedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}

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
  profile: router({
    me: protectedProcedure.query(({ ctx }) => getRideflowProfile(ctx.user.id)),
    upsert: protectedProcedure
      .input(z.object({
        role: z.enum(["customer", "driver"]),
        phone: z.string().max(32).optional(),
        licenseNumber: z.string().max(96).optional(),
        vehicleInfo: z.string().max(5000).optional(),
        insurancePolicy: z.string().max(128).optional(),
      }))
      .mutation(({ ctx, input }) => upsertRideflowProfile({ userId: ctx.user.id, ...input })),
  }),
  admin: router({
    settings: adminProcedure.query(() => getAdminSettings()),
    updateNotificationEmail: adminProcedure.input(z.object({ email: z.string().email() })).mutation(({ ctx, input }) => updateAdminSettings({ ownerEmail: input.email, notificationEmail: input.email, updatedByUserId: ctx.user.id })),
    transfer: adminProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(({ ctx, input }) => transferAdminToEmail(input.email, ctx.user.id)),
  }),
  fareRules: router({
    current: adminProcedure.query(() => getActiveFareRules("Nairobi")),
    update: adminProcedure
      .input(z.object({
        city: z.string().min(1).max(96),
        baseFareKsh: z.number().int().min(0),
        distanceRateKshPerKm: z.number().int().min(0),
        timeRateKshPerMinute: z.number().int().min(0),
        minimumFareKsh: z.number().int().min(0),
        safetyFeeKsh: z.number().int().min(0),
        platformCommissionBps: z.number().int().min(0).max(10000),
      }))
      .mutation(({ input }) => updateFareRules(input)),
  }),
  fares: router({
    quote: protectedProcedure
      .input(z.object({
        originLabel: z.string().min(1).max(255),
        destinationLabel: z.string().min(1).max(255),
        distanceMeters: z.number().int().min(0).max(500000),
        durationSeconds: z.number().int().min(0).max(86400),
      }))
      .mutation(async ({ ctx, input }) => {
        const configuredRules = await getActiveFareRules("Nairobi");
        const calculated = calculateRideflowFare({
          ...input,
          rules: configuredRules ? {
            baseFareKsh: configuredRules.baseFareKsh,
            distanceRateKshPerKm: configuredRules.distanceRateKshPerKm,
            timeRateKshPerMinute: configuredRules.timeRateKshPerMinute,
            minimumFareKsh: configuredRules.minimumFareKsh,
            safetyFeeKsh: configuredRules.safetyFeeKsh,
            platformCommissionRate: configuredRules.platformCommissionBps / 10000,
          } : undefined,
        });
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const quote = await insertFareQuote({
          riderUserId: ctx.user.id,
          originLabel: input.originLabel,
          destinationLabel: input.destinationLabel,
          distanceMeters: input.distanceMeters,
          durationSeconds: input.durationSeconds,
          baseFareKsh: calculated.baseFareKsh,
          distanceFareKsh: calculated.distanceFareKsh,
          timeFareKsh: calculated.timeFareKsh,
          safetyFeeKsh: calculated.safetyFeeKsh,
          subtotalKsh: calculated.subtotalKsh,
          platformCommissionKsh: calculated.platformCommissionKsh,
          riderTotalKsh: calculated.riderTotalKsh,
          driverEarningsKsh: calculated.driverEarningsKsh,
          currency: calculated.currency,
          expiresAt,
        });
        if (!quote) throw new Error("Quote could not be created");
        await insertLedgerEntries([
          { quoteId: quote.id, userId: ctx.user.id, entryType: "rider_charge", amountKsh: quote.riderTotalKsh, currency: "KES", description: "Upfront RideFlow fare quote" },
          { quoteId: quote.id, userId: ctx.user.id, entryType: "driver_earning", amountKsh: quote.driverEarningsKsh, currency: "KES", description: "Driver earnings after 5% commission" },
          { quoteId: quote.id, userId: 0, entryType: "platform_commission", amountKsh: quote.platformCommissionKsh, currency: "KES", description: "RideFlow platform commission reserved for owner settlement" },
        ]);
        return { quote, calculated };
      }),
  }),
  files: router({
    upload: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(128),
        purpose: uploadPurpose,
        base64: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!acceptedMimeTypes.has(input.mimeType)) {
          throw new Error("Unsupported file type. Use JPG, PNG, WEBP, or PDF.");
        }
        const rawBase64 = input.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(rawBase64, "base64");
        if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
          throw new Error("File must be between 1 byte and 8 MB.");
        }
        const stored = await storagePut(`${ctx.user.id}/rideflow/${input.purpose}/${safeFileName(input.name)}`, buffer, input.mimeType);
        const file = await insertRideflowFile({
          userId: ctx.user.id,
          purpose: input.purpose,
          originalName: input.name,
          mimeType: input.mimeType,
          byteSize: buffer.length,
          storageKey: stored.key,
          storageUrl: stored.url,
          reviewStatus: input.purpose === "profile_photo" ? "not_required" : "pending",
        });
        if (input.purpose === "profile_photo") {
          const existing = await getRideflowProfile(ctx.user.id);
          await upsertRideflowProfile({
            userId: ctx.user.id,
            role: existing?.role ?? "customer",
            phone: existing?.phone ?? undefined,
            licenseNumber: existing?.licenseNumber ?? undefined,
            vehicleInfo: existing?.vehicleInfo ?? undefined,
            insurancePolicy: existing?.insurancePolicy ?? undefined,
            driverVerificationStatus: existing?.driverVerificationStatus ?? "not_started",
            profilePhotoFileId: file.id,
          });
        }
        return file;
      }),
  }),
});

export type AppRouter = typeof appRouter;


