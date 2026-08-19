export const RIDEFLOW_FARE_RULES = {
  currency: "KES" as const,
  baseFareKsh: 100,
  distanceRateKshPerKm: 30,
  timeRateKshPerMinute: 3,
  minimumFareKsh: 200,
  safetyFeeKsh: 20,
  platformCommissionRate: 0.05,
};

export type FareCalculationInput = {
  distanceMeters: number;
  durationSeconds: number;
  rules?: Partial<typeof RIDEFLOW_FARE_RULES>;
};

export function calculateRideflowFare({ distanceMeters, durationSeconds, rules }: FareCalculationInput) {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) throw new Error("Distance must be a non-negative number");
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) throw new Error("Duration must be a non-negative number");

  const fareRules = { ...RIDEFLOW_FARE_RULES, ...rules };
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;
  const distanceFareKsh = Math.round(distanceKm * fareRules.distanceRateKshPerKm);
  const timeFareKsh = Math.round(durationMinutes * fareRules.timeRateKshPerMinute);
  const meteredFareKsh = fareRules.baseFareKsh + distanceFareKsh + timeFareKsh;
  const protectedFareKsh = Math.max(meteredFareKsh, fareRules.minimumFareKsh);
  const subtotalKsh = protectedFareKsh + fareRules.safetyFeeKsh;
  const platformCommissionKsh = Math.round(subtotalKsh * (fareRules.platformCommissionRate ?? 0.05));
  const driverEarningsKsh = subtotalKsh - platformCommissionKsh;

  return {
    currency: RIDEFLOW_FARE_RULES.currency,
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: Number(durationMinutes.toFixed(1)),
    baseFareKsh: fareRules.baseFareKsh,
    distanceFareKsh,
    timeFareKsh,
    safetyFeeKsh: fareRules.safetyFeeKsh,
    subtotalKsh,
    platformCommissionKsh,
    riderTotalKsh: subtotalKsh,
    driverEarningsKsh,
  };
}
