import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthorizationUrl, SCOPES } from "@/lib/connectors/google-oauth";
import { env } from "@/lib/env";
import type { ConnectorProvider } from "@/lib/supabase/database.types";

function isConnectorProvider(value: string | null): value is ConnectorProvider {
  return value === "google_calendar" || value === "gmail";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  if (!isConnectorProvider(provider)) {
    return NextResponse.json({ error: "Unknown or missing provider." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 500 });
  }

  const state = randomUUID();
  const url = buildAuthorizationUrl({
    clientId,
    redirectUri: `${env.siteUrl}/api/connectors/google/callback`,
    scope: SCOPES[provider],
    state,
  });

  const response = NextResponse.redirect(url);
  response.cookies.set("momentum_oauth_state", JSON.stringify({ state, provider }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
