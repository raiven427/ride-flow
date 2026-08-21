import { describe, expect, it } from "vitest";
import { getPaymentProviderStatus } from "./payments";

describe("payment provider configuration", () => {
  it("reports provider readiness without exposing secret values", () => {
    const statuses = getPaymentProviderStatus();
    expect(statuses).toHaveLength(2);
    expect(statuses.map(status => status.provider)).toEqual(["stripe", "daraja"]);
    expect(statuses.every(status => Array.isArray(status.missing))).toBe(true);
    expect(JSON.stringify(statuses)).not.toContain("sk_live_");
    expect(JSON.stringify(statuses)).not.toContain("sk_test_");
  });
});
