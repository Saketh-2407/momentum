import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/connectors/google-oauth";
import { encryptSecret } from "@/lib/connectors/crypto";
import { env } from "@/lib/env";
import type { ConnectorProvider } from "@/lib/supabase/database.types";

function redirectWithError(origin: string, message: string) {
  const url = new URL("/dashboard/settings", origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  const stateCookie = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("momentum_oauth_state="))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!code || !returnedState || !stateCookie) {
    return redirectWithError(origin, "The connection request was missing or expired. Try again.");
  }

  let provider: ConnectorProvider;
  try {
    const parsed = JSON.parse(decodeURIComponent(stateCookie));
    if (parsed.state !== returnedState) {
      return redirectWithError(origin, "The connection request could not be verified. Try again.");
    }
    provider = parsed.provider;
  } catch {
    return redirectWithError(origin, "The connection request could not be verified. Try again.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectWithError(origin, "Google OAuth is not configured.");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  try {
    const tokens = await exchangeCodeForTokens({
      clientId,
      clientSecret,
      redirectUri: `${env.siteUrl}/api/connectors/google/callback`,
      code,
    });

    if (!tokens.refreshToken) {
      return redirectWithError(
        origin,
        "Google didn't return a refresh token. Disconnect any prior grant in your Google Account and try again.",
      );
    }

    const { error } = await supabase.from("connections").upsert(
      {
        user_id: userId,
        provider,
        encrypted_refresh_token: encryptSecret(tokens.refreshToken),
        scope: tokens.scope,
      },
      { onConflict: "user_id,provider" },
    );

    if (error) {
      return redirectWithError(origin, error.message);
    }
  } catch (err) {
    return redirectWithError(
      origin,
      err instanceof Error ? err.message : "Couldn't complete the connection.",
    );
  }

  const successUrl = new URL("/dashboard/settings", origin);
  successUrl.searchParams.set("connected", provider);
  const response = NextResponse.redirect(successUrl);
  response.cookies.delete("momentum_oauth_state");
  return response;
}
