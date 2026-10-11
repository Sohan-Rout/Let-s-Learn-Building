// Copies the SQLite WASM runtime into public/ so it is served as-is.
// Turbopack can't bundle @sqlite.org/sqlite-wasm (it builds a dynamic Worker URL),
// so src/lib/sqlite/worker.ts loads it from /sqlite-wasm/ at runtime instead.
// Runs on postinstall; the output is git-ignored.
import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const src = join(import.meta.dirname, "../node_modules/@sqlite.org/sqlite-wasm/dist");
const dest = join(import.meta.dirname, "../public/sqlite-wasm");
const files = ["index.mjs", "sqlite3.wasm", "sqlite3-opfs-async-proxy.js"];

await mkdir(dest, { recursive: true });
await Promise.all(files.map((f) => cp(join(src, f), join(dest, f))));
console.log(`Copied sqlite-wasm runtime to public/sqlite-wasm`);
