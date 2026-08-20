import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Start the operator-configured OIDC login flow from a user event. */
export const startLogin = () => {
  const authorizeUrl = import.meta.env.VITE_OAUTH_AUTHORIZE_URL;
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID || import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  if (!authorizeUrl || !clientId) {
    throw new Error("OIDC login is not configured. Set VITE_OAUTH_AUTHORIZE_URL and VITE_OAUTH_CLIENT_ID.");
  }

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=Lax; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });
  const url = new URL(authorizeUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", import.meta.env.VITE_OAUTH_SCOPE || "openid profile email");
  url.searchParams.set("state", state);
  window.location.href = url.toString();
};
