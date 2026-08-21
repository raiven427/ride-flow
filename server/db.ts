import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, rideflowActivityEvents, rideflowAdminSettings, rideflowFareQuotes, rideflowFareRules, rideflowFiles, rideflowLedgerEntries, rideflowPresence, rideflowProfiles, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";

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
  const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  const isFirstSignup = existing.length === 0;
  const adminSettings = await getAdminSettings();
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
  } else if (user.openId === ENV.ownerOpenId || user.email === adminSettings?.ownerEmail || user.email === process.env.RIDEFLOW_ADMIN_EMAIL) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  const persistedUser = await getUserByOpenId(user.openId);
  await recordActivity({ userId: persistedUser?.id, eventType: "sign_in", summary: `Signed in${user.email ? ` as ${user.email}` : ""}`, metadata: { firstSignup: isFirstSignup } });
  if (isFirstSignup) await notifyNewSignup(user);
}

export async function notifyNewSignup(user: InsertUser, configuredRecipient?: string) {
  const settings = configuredRecipient ? { notificationEmail: configuredRecipient } : await getAdminSettings();
  await notifyOwner({
    title: "New RideFlow signup",
    content: `A new ${user.role === "admin" ? "admin" : "user"} account signed up${user.name ? `: ${user.name}` : ""}${user.email ? ` (${user.email})` : ""}. Configured admin notification recipient: ${settings?.notificationEmail ?? "not configured"}.`,
  });
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

export async function getAdminSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(rideflowAdminSettings).where(eq(rideflowAdminSettings.singletonKey, "primary")).limit(1);
  return rows[0];
}

export async function updateAdminSettings(input: { ownerEmail: string; notificationEmail: string; updatedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(rideflowAdminSettings).set(input).where(eq(rideflowAdminSettings.singletonKey, "primary"));
  return getAdminSettings();
}

export async function transferAdminToEmail(email: string, updatedByUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!target[0]) throw new Error("That email must sign in to RideFlow before it can become an admin.");
  await db.update(users).set({ role: "user" }).where(eq(users.role, "admin"));
  await db.update(users).set({ role: "admin" }).where(eq(users.id, target[0].id));
  return updateAdminSettings({ ownerEmail: email, notificationEmail: email, updatedByUserId });
}

export async function getActiveFareRules(city = "Nairobi") {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(rideflowFareRules).where(eq(rideflowFareRules.city, city)).limit(1);
  return rows[0];
}

export async function updateFareRules(input: {
  city: string;
  baseFareKsh: number;
  distanceRateKshPerKm: number;
  timeRateKshPerMinute: number;
  minimumFareKsh: number;
  safetyFeeKsh: number;
  platformCommissionBps: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(rideflowFareRules).set({
    baseFareKsh: input.baseFareKsh,
    distanceRateKshPerKm: input.distanceRateKshPerKm,
    timeRateKshPerMinute: input.timeRateKshPerMinute,
    minimumFareKsh: input.minimumFareKsh,
    safetyFeeKsh: input.safetyFeeKsh,
    platformCommissionBps: input.platformCommissionBps,
  }).where(eq(rideflowFareRules.city, input.city));
  return getActiveFareRules(input.city);
}

export async function insertFareQuote(input: typeof rideflowFareQuotes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(rideflowFareQuotes).values(input);
  const quoteId = Number((result as unknown as { insertId?: number }).insertId ?? 0);
  if (!quoteId) throw new Error("Fare quote could not be saved");
  const rows = await db.select().from(rideflowFareQuotes).where(eq(rideflowFareQuotes.id, quoteId)).limit(1);
  return rows[0];
}

export async function insertLedgerEntries(entries: Array<typeof rideflowLedgerEntries.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (entries.length === 0) return [];
  await db.insert(rideflowLedgerEntries).values(entries);
  return db.select().from(rideflowLedgerEntries).where(eq(rideflowLedgerEntries.quoteId, entries[0].quoteId));
}

export async function upsertPresence(input: { userId: number; status: "online" | "away" | "offline"; currentView?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(rideflowPresence).values({ userId: input.userId, status: input.status, currentView: input.currentView ?? null, lastSeenAt: new Date() }).onDuplicateKeyUpdate({ set: { status: input.status, currentView: input.currentView ?? null, lastSeenAt: new Date() } });
}

export async function recordActivity(input: { userId?: number; eventType: string; summary: string; metadata?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(rideflowActivityEvents).values({ userId: input.userId ?? null, eventType: input.eventType, summary: input.summary, metadataJson: input.metadata ? JSON.stringify(input.metadata) : null });
}

export async function getAdminOperationsSnapshot() {
  const db = await getDb();
  if (!db) return { users: [], recentActivity: [], counts: { totalUsers: 0, onlineUsers: 0, drivers: 0, customers: 0 } };
  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn, presenceStatus: rideflowPresence.status, currentView: rideflowPresence.currentView, lastSeenAt: rideflowPresence.lastSeenAt }).from(users).leftJoin(rideflowPresence, eq(users.id, rideflowPresence.userId)).orderBy(desc(users.lastSignedIn));
  const recentActivity = await db.select().from(rideflowActivityEvents).orderBy(desc(rideflowActivityEvents.createdAt)).limit(30);
  const cutoff = Date.now() - 90_000;
  const onlineUsers = allUsers.filter(user => user.presenceStatus === "online" && user.lastSeenAt && user.lastSeenAt.getTime() >= cutoff);
  return { users: allUsers, recentActivity, counts: { totalUsers: allUsers.length, onlineUsers: onlineUsers.length, drivers: 0, customers: 0 } };
}

