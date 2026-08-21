import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import Stripe from "stripe";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.get("/healthz", (_req, res) => {
    res.json({ ok: true, service: "rideflow", environment: process.env.NODE_ENV ?? "development" });
  });

  // Stripe must receive the raw request body for signature verification.
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), (req, res) => {
    if (!ENV.stripe.webhookSecret) {
      res.status(503).json({ error: "Stripe webhook secret is not configured" });
      return;
    }
    const signature = req.header("stripe-signature");
    if (!signature) {
      res.status(400).json({ error: "Missing Stripe-Signature header" });
      return;
    }
    try {
      const stripe = new Stripe(ENV.stripe.secretKey);
      const event = stripe.webhooks.constructEvent(req.body, signature, ENV.stripe.webhookSecret);
      console.info(`[Stripe] received ${event.type}`);
      res.json({ received: true });
    } catch (error) {
      console.error("[Stripe] webhook verification failed", error);
      res.status(400).json({ error: "Invalid Stripe webhook signature" });
    }
  });

  // Daraja callback route. Persist provider references in the payment ledger when the payment flow is wired.
  app.post(["/api/webhooks/daraja", "/api/webhooks/daraja/stk"], (req, res) => {
    console.info("[Daraja] callback received", { resultCode: req.body?.Body?.stkCallback?.ResultCode });
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
