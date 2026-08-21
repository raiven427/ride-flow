import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getAdminOperationsSnapshot: vi.fn(), recordActivity: vi.fn() }));
vi.mock("./db", () => ({ getAdminOperationsSnapshot: mocks.getAdminOperationsSnapshot, recordActivity: mocks.recordActivity }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 1, openId: role, email: `${role}@example.com`, name: role, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("RideFlow admin operations", () => {
  it("returns the live operations snapshot to admins", async () => {
    mocks.getAdminOperationsSnapshot.mockResolvedValue({ users: [], recentActivity: [], counts: { totalUsers: 0, onlineUsers: 0, drivers: 0, customers: 0 } });
    const result = await appRouter.createCaller(context("admin")).admin.operations();
    expect(result.counts.onlineUsers).toBe(0);
  });

  it("rejects operations access for ordinary users", async () => {
    await expect(appRouter.createCaller(context("user")).admin.operations()).rejects.toThrow();
  });
});
