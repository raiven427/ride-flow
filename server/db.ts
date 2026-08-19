import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, rideflowFiles, rideflowProfiles, users } from "../drizzle/schema";
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
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getRideflowProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rideflowProfiles).where(eq(rideflowProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertRideflowProfile(input: typeof rideflowProfiles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(rideflowProfiles).values(input).onDuplicateKeyUpdate({
    set: {
      role: input.role,
      phone: input.phone,
      profilePhotoFileId: input.profilePhotoFileId,
      licenseNumber: input.licenseNumber,
      vehicleInfo: input.vehicleInfo,
      insurancePolicy: input.insurancePolicy,
      driverVerificationStatus: input.driverVerificationStatus,
    },
  });
  return getRideflowProfile(input.userId);
}

export async function insertRideflowFile(input: typeof rideflowFiles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(rideflowFiles).values(input);
  const fileId = Number((result as unknown as { insertId?: number }).insertId ?? 0);
  if (!fileId) throw new Error("Uploaded file metadata could not be saved");
  const rows = await db.select().from(rideflowFiles).where(eq(rideflowFiles.id, fileId)).limit(1);
  return rows[0];
}

