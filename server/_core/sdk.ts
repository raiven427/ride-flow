import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

type OAuthTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type OAuthUserInfo = {
  sub?: string;
  id?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
};

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

function requireOAuthConfig() {
  if (!ENV.oauthTokenUrl || !ENV.oauthUserInfoUrl || !ENV.oauthClientId) {
    throw new Error(
      "OIDC is not configured. Set OAUTH_TOKEN_URL, OAUTH_USERINFO_URL, and OAUTH_CLIENT_ID.",
    );
  }
}

class SDKServer {
  private sessionSecret() {
    if (!ENV.cookieSecret) {
      throw new Error("JWT_SECRET is required for self-hosted sessions.");
    }
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    requireOAuthConfig();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: ENV.oauthClientId,
    });
    if (ENV.oauthClientSecret) body.set("client_secret", ENV.oauthClientSecret);

    const response = await fetch(ENV.oauthTokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) {
      throw new Error(`OIDC token exchange failed (${response.status})`);
    }
    return (await response.json()) as OAuthTokenResponse;
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo & { openId: string; loginMethod: string }> {
    requireOAuthConfig();
    const response = await fetch(ENV.oauthUserInfoUrl, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`OIDC userinfo request failed (${response.status})`);
    }
    const info = (await response.json()) as OAuthUserInfo;
    const openId = info.sub || info.id;
    if (!openId) throw new Error("OIDC userinfo response is missing sub or id.");
    return {
      ...info,
      openId,
      loginMethod: "oidc",
      name: info.name || info.preferred_username || info.email || openId,
    };
  }

  async createSessionToken(openId: string, options: { expiresInMs?: number; name?: string } = {}) {
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    return this.signSession(
      { openId, appId: ENV.appId, name: options.name || "" },
      { expiresInMs },
    );
  }

  async signSession(payload: SessionPayload, options: { expiresInMs?: number } = {}) {
    const issuedAt = Date.now();
    const expirationSeconds = Math.floor(
      (issuedAt + (options.expiresInMs ?? ONE_YEAR_MS)) / 1000,
    );
    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.sessionSecret());
  }

  async verifySession(cookieValue: string | undefined | null) {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.sessionSecret(), {
        algorithms: ["HS256"],
      });
      if (typeof payload.openId !== "string") return null;
      return {
        openId: payload.openId,
        appId: typeof payload.appId === "string" ? payload.appId : ENV.appId,
        name: typeof payload.name === "string" ? payload.name : "",
      };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined;
    const session = await this.verifySession(cookies[COOKIE_NAME] || bearer);
    if (!session) throw ForbiddenError("Invalid session");

    const user = await db.getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");
    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    return user;
  }
}

export const sdk = new SDKServer();
