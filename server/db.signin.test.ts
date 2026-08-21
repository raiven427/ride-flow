import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  selectResults: [] as unknown[][],
  activityPayloads: [] as unknown[],
  notifyOwner: vi.fn(),
}));

const db = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({ limit: vi.fn(async () => state.selectResults.shift() ?? []) })),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn((values: unknown) => {
      const operation = { onDuplicateKeyUpdate: vi.fn(async () => undefined) };
      if (values && typeof values === "object" && "eventType" in values) state.activityPayloads.push(values);
      return { ...operation, values };
    }),
  })),
};

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => db) }));
vi.mock("./_core/notification", () => ({ notifyOwner: state.notifyOwner }));

import { upsertUser } from "./db";

describe("upsertUser sign-in activity", () => {
  beforeEach(() => {
    state.selectResults = [];
    state.activityPayloads = [];
    state.notifyOwner.mockReset();
    db.insert.mockClear();
    db.select.mockClear();
  });

  it("records first-signup metadata and sends the signup notification", async () => {
    state.selectResults = [[], [], [{ id: 7, openId: "new-user", email: "new@example.com" }], []];
    await upsertUser({ openId: "new-user", email: "new@example.com", name: "New User", role: "user" });
    expect(state.activityPayloads).toEqual([expect.objectContaining({ eventType: "sign_in", userId: 7, summary: "Signed in as new@example.com", metadataJson: JSON.stringify({ firstSignup: true }) })]);
    expect(state.notifyOwner).toHaveBeenCalledOnce();
  });

  it("records returning sign-ins without sending a new-signup notification", async () => {
    state.selectResults = [[{ id: 9, openId: "returning-user", email: "returning@example.com" }], [], [{ id: 9, openId: "returning-user", email: "returning@example.com" }]];
    await upsertUser({ openId: "returning-user", email: "returning@example.com", name: "Returning User", role: "user" });
    expect(state.activityPayloads).toEqual([expect.objectContaining({ eventType: "sign_in", userId: 9, metadataJson: JSON.stringify({ firstSignup: false }) })]);
    expect(state.notifyOwner).not.toHaveBeenCalled();
  });
});
