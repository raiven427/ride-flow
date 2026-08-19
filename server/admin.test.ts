import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminSettings: vi.fn(),
  updateFareRules: vi.fn(),
  transferAdminToEmail: vi.fn(),
  notifyOwner: vi.fn(),
  notifyNewSignup: vi.fn(async (user: { email?: string }, recipient?: string) => mocks.notifyOwner({ title: "New RideFlow signup", content: `A new user account signed up${user.email ? ` (${user.email})` : ""}. Configured admin notification recipient: ${recipient ?? "not configured"}.` })),
}));

vi.mock("./db", () => ({
  getAdminSettings: mocks.getAdminSettings,
  updateFareRules: mocks.updateFareRules,
  transferAdminToEmail: mocks.transferAdminToEmail,
  notifyNewSignup: mocks.notifyNewSignup,
}));
vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));

import { appRouter } from "./routers";
import { notifyNewSignup } from "./db";
import type { TrpcContext } from "./_core/context";

function adminContext(): TrpcContext {
  return {
    user: { id: 1, openId: "admin", email: "njengastephen112@gmail.com", name: "RideFlow Admin", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function userContext(): TrpcContext {
  return { ...adminContext(), user: { ...adminContext().user!, role: "user" } };
}

describe("RideFlow admin controls", () => {
  it("allows admins to update fare rules", async () => {
    mocks.updateFareRules.mockResolvedValue({ city: "Nairobi", platformCommissionBps: 500 });
    const result = await appRouter.createCaller(adminContext()).fareRules.update({ city: "Nairobi", baseFareKsh: 100, distanceRateKshPerKm: 30, timeRateKshPerMinute: 3, minimumFareKsh: 200, safetyFeeKsh: 20, platformCommissionBps: 500 });
    expect(result.city).toBe("Nairobi");
    expect(mocks.updateFareRules).toHaveBeenCalledOnce();
  });

  it("rejects fare changes for ordinary users", async () => {
    await expect(appRouter.createCaller(userContext()).fareRules.update({ city: "Nairobi", baseFareKsh: 100, distanceRateKshPerKm: 30, timeRateKshPerMinute: 3, minimumFareKsh: 200, safetyFeeKsh: 20, platformCommissionBps: 500 })).rejects.toThrow();
  });

  it("transfers admin ownership to a verified user", async () => {
    mocks.transferAdminToEmail.mockResolvedValue({ ownerEmail: "new-admin@example.com" });
    const result = await appRouter.createCaller(adminContext()).admin.transfer({ email: "new-admin@example.com" });
    expect(result.ownerEmail).toBe("new-admin@example.com");
    expect(mocks.transferAdminToEmail).toHaveBeenCalledWith("new-admin@example.com", 1);
  });

  it("surfaces the verified-user requirement when transfer fails", async () => {
    mocks.transferAdminToEmail.mockRejectedValue(new Error("That email must sign in to RideFlow before it can become an admin."));
    await expect(appRouter.createCaller(adminContext()).admin.transfer({ email: "not-signed-in@example.com" })).rejects.toThrow("must sign in");
  });

  it("dispatches a signup notification to the configured recipient", async () => {
    await notifyNewSignup({ openId: "new", name: "New Rider", email: "rider@example.com", role: "user" }, "njengastephen112@gmail.com");
    expect(mocks.notifyOwner).toHaveBeenCalledWith(expect.objectContaining({ title: "New RideFlow signup", content: expect.stringContaining("rider@example.com") }));
  });
});
