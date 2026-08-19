import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing Manus auth. */
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

export const rideflowProfiles = mysqlTable("rideflow_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  role: mysqlEnum("role", ["customer", "driver"]).default("customer").notNull(),
  phone: varchar("phone", { length: 32 }),
  profilePhotoFileId: int("profilePhotoFileId"),
  licenseNumber: varchar("licenseNumber", { length: 96 }),
  vehicleInfo: text("vehicleInfo"),
  insurancePolicy: varchar("insurancePolicy", { length: 128 }),
  driverVerificationStatus: mysqlEnum("driverVerificationStatus", ["not_started", "pending", "approved", "rejected"]).default("not_started").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const rideflowFiles = mysqlTable("rideflow_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  purpose: mysqlEnum("purpose", ["profile_photo", "driver_license", "insurance", "vehicle_document", "lost_item"]).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  byteSize: int("byteSize").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
  storageUrl: varchar("storageUrl", { length: 768 }).notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["not_required", "pending", "approved", "rejected"]).default("not_required").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type RideflowProfile = typeof rideflowProfiles.$inferSelect;
export const rideflowFareRules = mysqlTable("rideflow_fare_rules", {
  id: int("id").autoincrement().primaryKey(),
  city: varchar("city", { length: 96 }).notNull().unique(),
  baseFareKsh: int("baseFareKsh").notNull(),
  distanceRateKshPerKm: int("distanceRateKshPerKm").notNull(),
  timeRateKshPerMinute: int("timeRateKshPerMinute").notNull(),
  minimumFareKsh: int("minimumFareKsh").notNull(),
  safetyFeeKsh: int("safetyFeeKsh").notNull(),
  platformCommissionBps: int("platformCommissionBps").notNull().default(500),
  active: int("active").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const rideflowFareQuotes = mysqlTable("rideflow_fare_quotes", {
  id: int("id").autoincrement().primaryKey(),
  riderUserId: int("riderUserId").notNull(),
  originLabel: varchar("originLabel", { length: 255 }).notNull(),
  destinationLabel: varchar("destinationLabel", { length: 255 }).notNull(),
  distanceMeters: int("distanceMeters").notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  baseFareKsh: int("baseFareKsh").notNull(),
  distanceFareKsh: int("distanceFareKsh").notNull(),
  timeFareKsh: int("timeFareKsh").notNull(),
  safetyFeeKsh: int("safetyFeeKsh").notNull(),
  subtotalKsh: int("subtotalKsh").notNull(),
  platformCommissionKsh: int("platformCommissionKsh").notNull(),
  riderTotalKsh: int("riderTotalKsh").notNull(),
  driverEarningsKsh: int("driverEarningsKsh").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("KES"),
  status: mysqlEnum("status", ["quoted", "accepted", "completed", "cancelled"]).default("quoted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export const rideflowLedgerEntries = mysqlTable("rideflow_ledger_entries", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  userId: int("userId").notNull(),
  entryType: mysqlEnum("entryType", ["rider_charge", "driver_earning", "platform_commission", "refund", "tip", "payout"]).notNull(),
  amountKsh: int("amountKsh").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("KES"),
  description: varchar("description", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RideflowFile = typeof rideflowFiles.$inferSelect;
export type RideflowFareRule = typeof rideflowFareRules.$inferSelect;
export type RideflowFareQuote = typeof rideflowFareQuotes.$inferSelect;
export type RideflowLedgerEntry = typeof rideflowLedgerEntries.$inferSelect;
