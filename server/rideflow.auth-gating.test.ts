import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("RideFlow protected marketplace procedures", () => {
  it("rejects fare quotes for anonymous users", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.fares.quote({
      originLabel: "Home",
      destinationLabel: "Market Street",
      distanceMeters: 8400,
      durationSeconds: 1440,
    })).rejects.toThrow();
  });

  it("rejects document uploads for anonymous users", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.files.upload({
      name: "license.png",
      mimeType: "image/png",
      purpose: "driver_license",
      base64: "aGVsbG8=",
    })).rejects.toThrow();
  });
});
