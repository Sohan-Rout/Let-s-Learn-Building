export type SqlParam = string | number | bigint | boolean | null | Uint8Array;

export type WorkerRequest = {
  id: number;
  /** `null` is a no-op used to wait for the database to open. */
  sql: string | null;
  bind?: SqlParam[] | Record<string, SqlParam>;
};

export type WorkerResponse =
  | { id: number; ok: true; rows: Record<string, unknown>[]; persistent: boolean }
  | { id: number; ok: false; error: string };
