import { query } from "./client";

type OutboxRow = {
  id: number;
  url: string;
  method: string;
  headers: string | null;
  body: string | null;
};

export type SendResult = { queued: false; response: Response } | { queued: true };

/**
 * Send a write (POST/PUT/PATCH/DELETE). If the network is down the request is
 * saved and replayed automatically when the connection returns
 * (see <OfflineSync />). Server errors (4xx/5xx) are NOT queued.
 * Only string bodies (e.g. JSON.stringify) are supported.
 */
export async function sendOrQueue(
  url: string,
  init: RequestInit & { body?: string | null } = {},
): Promise<SendResult> {
  if (navigator.onLine) {
    try {
      return { queued: false, response: await fetch(url, init) };
    } catch {
      // Network failure, fall through and queue.
    }
  }

  await query(
    "INSERT INTO outbox (url, method, headers, body, created_at) VALUES (?, ?, ?, ?, ?)",
    [
      url,
      init.method ?? "POST",
      init.headers ? JSON.stringify(Object.fromEntries(new Headers(init.headers))) : null,
      init.body ?? null,
      Date.now(),
    ],
  );
  return { queued: true };
}

let flushing: Promise<number> | null = null;

/** Replay queued requests in order. Returns how many were sent. Stops at the first network failure. */
export function flushOutbox(): Promise<number> {
  flushing ??= (async () => {
    let sent = 0;
    try {
      const rows = await query<OutboxRow>(
        "SELECT id, url, method, headers, body FROM outbox ORDER BY id",
      );
      for (const row of rows) {
        try {
          await fetch(row.url, {
            method: row.method,
            headers: row.headers ? JSON.parse(row.headers) : undefined,
            body: row.body,
          });
        } catch {
          await query("UPDATE outbox SET attempts = attempts + 1 WHERE id = ?", [row.id]);
          break; // Still offline, keep the rest queued in order.
        }
        await query("DELETE FROM outbox WHERE id = ?", [row.id]);
        sent++;
      }
    } finally {
      flushing = null;
    }
    return sent;
  })();
  return flushing;
}

export async function outboxCount(): Promise<number> {
  const [row] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM outbox");
  return row?.n ?? 0;
}
