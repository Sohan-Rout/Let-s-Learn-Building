// Browser-only handle to the SQLite worker. Safe to import from client
// components; the worker is created lazily on the first query.
import type { SqlParam, WorkerRequest, WorkerResponse } from "./types";

type Pending = {
  resolve: (res: Extract<WorkerResponse, { ok: true }>) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (typeof window === "undefined") {
    throw new Error("SQLite is browser-only. Call it from a client component or effect.");
  }

  if (!worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const res = event.data;
      const entry = pending.get(res.id);
      if (!entry) return;
      pending.delete(res.id);
      if (res.ok) entry.resolve(res);
      else entry.reject(new Error(res.error));
    };
  }

  return worker;
}

function send(sql: string | null, bind?: WorkerRequest["bind"]) {
  const id = nextId++;
  return new Promise<Extract<WorkerResponse, { ok: true }>>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, sql, bind } satisfies WorkerRequest);
  });
}

/** Run a statement and return result rows as objects. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  bind?: SqlParam[] | Record<string, SqlParam>,
): Promise<T[]> {
  const res = await send(sql, bind);
  return res.rows as T[];
}

/** Resolves once the DB is open. `persistent` is false if it fell back to memory. */
export async function ready(): Promise<{ persistent: boolean }> {
  const res = await send(null);
  return { persistent: res.persistent };
}
