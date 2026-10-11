"use client";

import { useEffect } from "react";
import { flushOutbox } from "@/lib/sqlite/outbox";
import { useOnlineStatus } from "@/hooks/use-online-status";

/** Replays writes queued while offline. Rendered once in the root layout. */
export function OfflineSync() {
  const online = useOnlineStatus();

  useEffect(() => {
    if (online) flushOutbox().catch((err) => console.warn("[sqlite] outbox flush failed:", err));
  }, [online]);

  return null;
}
