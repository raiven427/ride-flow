import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("rideflow file uploads", () => {
  it("rejects unsupported MIME types before storage is called", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "storage-test-user",
        email: "storage@example.com",
        name: "Storage Test",
        loginMethod: "test",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.files.upload({
      name: "script.exe",
      mimeType: "application/x-msdownload",
      purpose: "profile_photo",
      base64: "aGVsbG8=",
    })).rejects.toThrow("Unsupported file type");
  });
});
