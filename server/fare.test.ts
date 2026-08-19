import { describe, expect, it } from "vitest";
import { calculateRideflowFare } from "./fare";

describe("calculateRideflowFare", () => {
  it("calculates the documented 8.4 km / 24 minute Nairobi demo quote", () => {
    const fare = calculateRideflowFare({ distanceMeters: 8400, durationSeconds: 24 * 60 });
    expect(fare).toMatchObject({
      baseFareKsh: 100,
      distanceFareKsh: 252,
      timeFareKsh: 72,
      safetyFeeKsh: 20,
      subtotalKsh: 444,
      platformCommissionKsh: 22,
      riderTotalKsh: 444,
      driverEarningsKsh: 422,
      currency: "KES",
    });
  });

  it("protects the minimum fare before adding the safety fee", () => {
    const fare = calculateRideflowFare({ distanceMeters: 1000, durationSeconds: 2 * 60 });
    expect(fare.subtotalKsh).toBe(220);
    expect(fare.platformCommissionKsh).toBe(11);
    expect(fare.driverEarningsKsh).toBe(209);
  });
});
