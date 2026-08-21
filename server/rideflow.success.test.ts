import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveFareRules: vi.fn(),
  insertFareQuote: vi.fn(),
  insertLedgerEntries: vi.fn(),
  insertRideflowFile: vi.fn(),
  getRideflowProfile: vi.fn(),
  upsertRideflowProfile: vi.fn(),
  storagePut: vi.fn(),
  recordActivity: vi.fn(),
}));

vi.mock("./db", () => mocks);
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "success-test-user",
      email: "success@example.com",
      name: "Success Test",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("RideFlow authenticated success paths", () => {
  it("creates a KSh fare quote and three ledger entries", async () => {
    mocks.getActiveFareRules.mockResolvedValue({
      city: "Nairobi",
      baseFareKsh: 100,
      distanceRateKshPerKm: 30,
      timeRateKshPerMinute: 3,
      minimumFareKsh: 200,
      safetyFeeKsh: 20,
      platformCommissionBps: 500,
    });
    mocks.insertFareQuote.mockResolvedValue({ id: 7, riderTotalKsh: 444, driverEarningsKsh: 422, platformCommissionKsh: 22 });
    mocks.insertLedgerEntries.mockResolvedValue([]);

    const caller = appRouter.createCaller(authenticatedContext());
    const result = await caller.fares.quote({
      originLabel: "Home",
      destinationLabel: "Market Street",
      distanceMeters: 8400,
      durationSeconds: 1440,
    });

    expect(result.quote.id).toBe(7);
    expect(result.calculated.riderTotalKsh).toBe(444);
    expect(result.calculated.platformCommissionKsh).toBe(22);
    expect(mocks.insertLedgerEntries).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ entryType: "platform_commission", amountKsh: 22 }),
    ]));
  });

  it("uploads a driver license and persists private metadata", async () => {
    mocks.storagePut.mockResolvedValue({ key: "42/rideflow/driver_license/license_abc.png", url: "https://storage.example.test/42/rideflow/driver_license/license_abc.png" });
    mocks.insertRideflowFile.mockResolvedValue({ id: 12, purpose: "driver_license", reviewStatus: "pending" });

    const caller = appRouter.createCaller(authenticatedContext());
    const result = await caller.files.upload({
      name: "license.png",
      mimeType: "image/png",
      purpose: "driver_license",
      base64: "aGVsbG8=",
    });

    expect(result.id).toBe(12);
    expect(result.purpose).toBe("driver_license");
    expect(mocks.storagePut).toHaveBeenCalledOnce();
    expect(mocks.insertRideflowFile).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      purpose: "driver_license",
      reviewStatus: "pending",
    }));
  });
});
