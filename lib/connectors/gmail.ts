const MAX_MESSAGES = 20;

export interface EmailSummary {
  id: string;
  subject: string;
  snippet: string;
  from: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessageMetadata {
  id: string;
  snippet?: string;
  payload?: { headers?: GmailHeader[] };
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

/**
 * Maps one raw Gmail metadata response into our internal shape. Deliberately
 * never touches the message body — `format=metadata` in the caller means the
 * body is never even fetched, per the "store the minimum" privacy rule.
 */
export function mapGmailMessage(raw: GmailMessageMetadata): EmailSummary {
  return {
    id: raw.id,
    subject: headerValue(raw.payload?.headers, "Subject") || "(no subject)",
    snippet: raw.snippet ?? "",
    from: headerValue(raw.payload?.headers, "From"),
  };
}

async function fetchJson(url: string, accessToken: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Gmail request failed (${response.status}): ${body.slice(0, 500)}`);
  }
  return response.json();
}

export async function fetchRecentMessages(accessToken: string): Promise<EmailSummary[]> {
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("maxResults", String(MAX_MESSAGES));
  listUrl.searchParams.set("q", "newer_than:7d in:inbox");

  const list = (await fetchJson(listUrl.toString(), accessToken)) as {
    messages?: { id: string }[];
  };
  const ids = (list.messages ?? []).map((m) => m.id);

  const messages = await Promise.all(
    ids.map(async (id) => {
      const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
      url.searchParams.set("format", "metadata");
      url.searchParams.append("metadataHeaders", "Subject");
      url.searchParams.append("metadataHeaders", "From");
      const raw = (await fetchJson(url.toString(), accessToken)) as GmailMessageMetadata;
      return mapGmailMessage(raw);
    }),
  );

  return messages;
}
