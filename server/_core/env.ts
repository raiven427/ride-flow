export const ENV = {
  appId: process.env.OAUTH_CLIENT_ID ?? process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_ISSUER_URL ?? process.env.OAUTH_SERVER_URL ?? "",
  oauthTokenUrl: process.env.OAUTH_TOKEN_URL ?? "",
  oauthUserInfoUrl: process.env.OAUTH_USERINFO_URL ?? "",
  oauthClientId: process.env.OAUTH_CLIENT_ID ?? process.env.VITE_APP_ID ?? "",
  oauthClientSecret: process.env.OAUTH_CLIENT_SECRET ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
