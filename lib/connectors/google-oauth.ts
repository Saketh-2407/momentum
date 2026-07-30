import type { ConnectorProvider } from "@/lib/supabase/database.types";

export const SCOPES: Record<ConnectorProvider, string> = {
  google_calendar: "https://www.googleapis.com/auth/calendar.readonly",
  gmail: "https://www.googleapis.com/auth/gmail.readonly",
};

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export interface AuthorizationUrlParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
}

/**
 * Builds the URL to send the user to for consent. `access_type=offline` +
 * `prompt=consent` guarantee a refresh token even on a repeat authorization
 * (Google otherwise only issues one on the very first consent).
 */
export function buildAuthorizationUrl(params: AuthorizationUrlParams): string {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", params.state);
  return url.toString();
}

export interface ExchangeCodeParams {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  scope: string;
}

export async function exchangeCodeForTokens(params: ExchangeCodeParams): Promise<TokenResponse> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
      code: params.code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

export async function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google token refresh failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}
