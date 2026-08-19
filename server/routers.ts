import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { insertRideflowFile, getRideflowProfile, upsertRideflowProfile } from "./db";
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


