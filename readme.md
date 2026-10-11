# Hackathon Project

> ⚠️ **This project uses [Bun](https://bun.com) only.**
> `npm`, `yarn` and `pnpm` are blocked and installs with them will fail. Use `bun` for everything.

---

## 1. Install Bun

You need **Bun v1.3.0 or newer**. Check if it's already installed:

```bash
bun --version
```

### macOS / Linux

```bash
curl -fsSL https://bun.com/install | bash
```

Or with Homebrew (macOS):

```bash
brew install oven-sh/bun/bun
```

### Windows (PowerShell)

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Already have Node.js?

If you already have Node.js installed, you can use npm **once** to install Bun globally. This is the only time npm should be used:

```bash
npm install -g bun
```

### After installing

Restart your terminal (or run `source ~/.zshrc` / `source ~/.bashrc`), then verify:

```bash
bun --version   # should print 1.3.x or newer
```

To upgrade later:

```bash
bun upgrade
```

---

## 2. Do I still need Node.js?

**No.** Bun is a full replacement for Node.js. It's a runtime, package manager, bundler and test runner in one. It's compatible with Node APIs (`fs`, `path`, `http`, …) and with packages from the npm registry.

| Instead of (Node)          | Use (Bun)                 |
| -------------------------- | ------------------------- |
| `npm install`              | `bun install`             |
| `npm install <pkg>`        | `bun add <pkg>`           |
| `npm install -D <pkg>`     | `bun add -d <pkg>`        |
| `npm uninstall <pkg>`      | `bun remove <pkg>`        |
| `npm run <script>`         | `bun run <script>`        |
| `npx <cmd>`                | `bunx <cmd>`              |
| `node index.js`            | `bun index.ts`            |
| `ts-node` / `tsx`          | `bun index.ts` (built in) |
| `nodemon`                  | `bun --watch index.ts`    |
| `jest` / `vitest`          | `bun test`                |
| `dotenv`                   | Not needed. Bun loads `.env` automatically |

---

## 3. Run the project

| Folder      | Stack                                                       |
| ----------- | ----------------------------------------------------------- |
| `frontend/` | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4      |
| `backend/`  | Bun + TypeScript                                            |

### Frontend

```bash
cd frontend
bun install      # install dependencies
bun run dev      # dev server → http://localhost:3000
bun run build    # production build
bun run start    # serve the production build
bun run lint     # ESLint
```

All Next.js scripts run on the Bun runtime (`bun --bun next ...`), not Node.

Code lives in `frontend/src/app/`. Use the `@/*` import alias for `src/*`, e.g. `import Button from "@/components/Button"`.

#### Offline cache (SQLite in the browser)

The frontend has a real SQLite database stored on the user's device (`@sqlite.org/sqlite-wasm`, kept in the browser's private file storage). The app keeps showing data on a choppy or dropped connection.

```tsx
"use client";
import { useCachedFetch } from "@/hooks/use-cached-fetch";

const { data, isLoading, fromCache, stale, online, refresh } = useCachedFetch<Item[]>("/api/items");
// Shows the cached copy instantly, refreshes from the network, keeps the cached copy if the request fails.
```

| Need                                   | Use                                                     |
| -------------------------------------- | ------------------------------------------------------- |
| Fetch data with offline fallback       | `useCachedFetch(url)` or `cachedFetch(url)`             |
| Store/read anything yourself           | `cacheSet(key, value, ttlMs?)` / `cacheGet(key)`        |
| Send a write that survives going offline | `sendOrQueue(url, { method, body })`. Replays automatically when back online |
| Show an offline banner                 | `useOnlineStatus()`                                     |
| Run your own SQL                       | `query(sql, params)` from `@/lib/sqlite/client`         |

The code is in `src/lib/sqlite/`, and the tables are defined in `worker.ts`. `bun install` copies the SQLite runtime into `public/sqlite-wasm/` (git-ignored) because Turbopack can't bundle it.

### Backend

```bash
cd backend
bun install      # install dependencies
bun run dev      # start with auto-reload
bun run start    # start normally
```

---

## 4. Why Bun only (how it's enforced)

All of us must use the same package manager. Otherwise we get conflicting lockfiles and "works on my machine" bugs. Both `frontend/` and `backend/` enforce this in four ways:

1. **`engines` + `.npmrc` (`engine-strict=true`)**: npm, yarn and pnpm refuse to install and fail with an `EBADENGINE` / unsupported engine error.
2. **`preinstall` guard (`scripts/only-bun.js`)**: if the engine check is bypassed, the install still stops with a "use Bun" message.
3. **`packageManager: "bun@1.3.14"`**: tells tooling (Corepack, editors, CI) that Bun is the package manager.
4. **`.gitignore`**: `package-lock.json`, `yarn.lock` and `pnpm-lock.yaml` are ignored, so only `bun.lock` gets committed.

**Rules for the team**

- ✅ Always commit `bun.lock` when you add or remove a dependency.
- ❌ Never run `npm install`, `yarn` or `pnpm install` in this repo.
- ❌ Never commit a `package-lock.json`, `yarn.lock` or `pnpm-lock.yaml`.
- When adding another package folder, copy `.npmrc`, `scripts/only-bun.js`, and the `engines` / `packageManager` / `preinstall` fields from `backend/package.json`.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `bun: command not found` | Restart your terminal, or add `~/.bun/bin` to your `PATH`. |
| `EBADENGINE` / "This project uses Bun only" | You used npm/yarn/pnpm. Run `bun install` instead. |
| Weird dependency errors | `rm -rf node_modules && bun install` |
| A package CLI (e.g. `vite`, `next`) runs under Node instead of Bun | Use `bun run --bun <script>` to force it onto the Bun runtime. |
