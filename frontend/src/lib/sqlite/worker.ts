/// <reference lib="webworker" />
// Owns the SQLite database. OPFS-backed storage only works inside a worker,
// so every query from the page is sent here via postMessage (see ./client.ts).
import type sqlite3InitModuleType from "@sqlite.org/sqlite-wasm";
import type { WorkerRequest, WorkerResponse } from "./types";

// Loaded at runtime from public/ (copied by scripts/copy-sqlite-wasm.ts)
// because Turbopack can't bundle this package.
const SQLITE_WASM_URL = "/sqlite-wasm/index.mjs";

const DB_FILE = "/app.sqlite3";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS cache (
    key        TEXT PRIMARY KEY,
    value      TEXT    NOT NULL,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS outbox (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    url        TEXT    NOT NULL,
    method     TEXT    NOT NULL,
    headers    TEXT,
    body       TEXT,
    created_at INTEGER NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0
  );
`;

async function open() {
  const { default: sqlite3InitModule } = (await import(
    /* turbopackIgnore: true */ SQLITE_WASM_URL
  )) as { default: typeof sqlite3InitModuleType };
  const sqlite3 = await sqlite3InitModule();

  try {
    // opfs-sahpool persists to the device and, unlike the plain "opfs" VFS,
    // does not require COOP/COEP headers.
    const pool = await sqlite3.installOpfsSAHPoolVfs({});
    const db = new pool.OpfsSAHPoolDb(DB_FILE);
    db.exec(SCHEMA);
    return { db, persistent: true };
  } catch (err) {
    // OPFS unavailable (old browser, private mode, or another tab holds the
    // pool). Fall back to an in-memory DB so the app still works this session.
    console.warn("[sqlite] OPFS unavailable, using in-memory database:", err);
    const db = new sqlite3.oo1.DB(":memory:", "c");
    db.exec(SCHEMA);
    return { db, persistent: false };
  }
}

const ready = open();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, sql, bind } = event.data;
  let response: WorkerResponse;

  try {
    const { db, persistent } = await ready;
    if (sql === null) {
      response = { id, ok: true, rows: [], persistent };
    } else {
      const rows = db.exec({ sql, bind, rowMode: "object", returnValue: "resultRows" });
      response = { id, ok: true, rows, persistent };
    }
  } catch (err) {
    response = { id, ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  self.postMessage(response);
};
