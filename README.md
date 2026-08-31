# Turbo Monorepo Boiler Template

A batteries-included starting point for Node.js monorepos: **Vite** for building, **Turborepo** for
task orchestration and caching, **pnpm** workspaces for linking, and **Tilt** as the single dashboard
that brings up every local service with one command.

```bash
pnpm install
tilt up          # → http://localhost:10350
```

That starts Postgres, Redis, MinIO, and stripe-mock in Docker, the Fastify API on `:3001`, and the
React app on `:5173` — all in dependency order.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Layout](#project-layout)
- [Infrastructure (`infra/`)](#infrastructure-infra)
- [Commands](#commands)
- [Architecture](#architecture)
- [Adding a Workspace](#adding-a-workspace)
- [Environment](#environment)
- [CI](#ci)
- [A Note on TypeScript 5.x](#a-note-on-typescript-5x)
- [License](#license)

---

## Prerequisites

| Tool   | Version | Notes                              |
| ------ | ------- | ---------------------------------- |
| Node   | 22.23.2 | Managed by Volta (see below)       |
| pnpm   | 11.24.0 | Managed by Volta (see below)       |
| Docker | 28+     | Must be running before `tilt up`   |
| Tilt   | 0.34+   | https://docs.tilt.dev/install.html |

> Node 22 is a hard floor, not a preference: Vite 8 requires `^20.19.0 || >=22.12.0` and ESLint 10
> requires `^20.19.0 || ^22.13.0 || >=24`.

### Installing Node & pnpm with Volta

This repo uses [Volta](https://volta.sh) to pin Node and pnpm versions per-project. The pinned
versions live in `package.json` under the `"volta"` key, so every contributor gets the same
toolchain automatically — no manual `nvm use` required.

<details>
<summary><strong>Setup steps</strong></summary>

**1. Install Volta** (one-time, if you don't have it):

```bash
curl https://get.volta.sh | bash
```

This appends two lines to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
```

**2. If you also have nvm / fnm / asdf / n installed**, Volta must appear **last** in your shell
config so its PATH entry wins. Move the Volta lines to the **very end** of `~/.zshrc` (after any
nvm/asdf/bun block), then restart your terminal:

```bash
# ── end of ~/.zshrc ──────────────────────────────────────────────────
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
```

> **Why last?** Each `export PATH="...:$PATH"` prepends to PATH. The tool whose line runs last sits
> first in PATH and wins `which node`. If nvm's `nvm.sh` runs _after_ Volta, nvm's Node shadows
> Volta's — and you'll see the wrong version even though Volta is installed.

**3. Verify it works:**

```bash
exec zsh              # reload shell
node -v               # → v22.23.2  (matches package.json volta.node)
which node            # → ~/.volta/bin/node
pnpm -v               # → 11.24.0
```

**4. No extra install step.** Volta reads the `"volta"` block in `package.json` and transparently
uses the right Node and pnpm when you `cd` into this repo. There is nothing to run — it just works.

</details>

The repo also ships an `.nvmrc` for editors and CI environments that read it (GitHub Actions, VS
Code, etc.), but Volta is the recommended local workflow.

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd turbo-monorepo-boiler-template
pnpm install

# 2. Set up environment
cp .env.example .env   # defaults match docker-compose, works unedited

# 3. Start everything
tilt up                # → http://localhost:10350
```

| Service        | URL                    |
| -------------- | ---------------------- |
| Tilt dashboard | http://localhost:10350 |
| Web (React)    | http://localhost:5173  |
| API (Fastify)  | http://localhost:3001  |
| MinIO console  | http://localhost:9001  |
| Postgres       | `localhost:5432`       |
| Redis          | `localhost:6379`       |
| Stripe mock    | `localhost:12111`      |

---

## Project Layout

```
.
├── apps/
│   ├── web/             @repo/web       Vite 8 + React 19 SPA          :5173
│   └── api/             @repo/api       Fastify 5 + tsx                 :3001
├── packages/
│   ├── ui/              @repo/ui        Shared components (Vite lib)
│   └── config/          @repo/config    tsconfig / ESLint / Prettier bases
├── infra/
│   └── dev/             Docker Compose for local infra (Postgres, Redis, MinIO, Stripe mock)
├── tools/
│   └── cli/             Scaffolding CLI (`pnpm create:package`)
├── Tiltfile             Tilt orchestration (local_resource + docker_compose)
├── turbo.json           Turborepo pipeline config
└── pnpm-workspace.yaml  Workspace definitions + dependency catalog
```

---

## Infrastructure (`infra/`)

All local development infrastructure lives under `infra/dev/` and runs in Docker containers managed
by the `Tiltfile`.

### Services

| Service         | Image                         | Port(s)     | Purpose                      |
| --------------- | ----------------------------- | ----------- | ---------------------------- |
| **Postgres**    | `postgres:17.2`               | 5432        | Primary database             |
| **Redis**       | `redis:7.2`                   | 6379        | Cache / pub-sub / queues     |
| **MinIO (S3)**  | `minio/minio`                 | 9000 / 9001 | S3-compatible object storage |
| **Stripe mock** | `stripe/stripe-mock:v0.182.0` | 12111       | Local Stripe API for testing |

### Default credentials

| Service  | User / Key | Password / Secret |
| -------- | ---------- | ----------------- |
| Postgres | `postgres` | `postgres`        |
| MinIO    | `admin`    | `password`        |

> These are development-only defaults defined in `infra/dev/docker-compose.yml`. **Never use them in
> production.**

### Data persistence

Container data is mounted to `infra/dev/storage/` so it survives `docker compose down`:

- `infra/dev/storage/postgres@17/` — Postgres data directory
- `infra/dev/storage/redis/data/` — Redis AOF/RDB files
- `infra/dev/storage/s3/` — MinIO object data

To wipe everything and start fresh:

```bash
tilt down
rm -rf infra/dev/storage
tilt up
```

### How Tilt uses it

The `Tiltfile` at the repo root calls `docker_compose('./infra/dev/docker-compose.yml')` and wires the
containers as dependencies — the API won't start until Postgres passes its healthcheck. See
[Architecture → Tilt owns local dev](#tilt-owns-local-dev) for the full picture.

---

## Commands

Run from the repo root; Turborepo fans them out and caches results.

| Command          | What it does                                         |
| ---------------- | ---------------------------------------------------- |
| `pnpm dev`       | All dev servers (prefer `tilt up`, which adds infra) |
| `pnpm build`     | Build every workspace in dependency order            |
| `pnpm lint`      | ESLint, with type-aware rules                        |
| `pnpm typecheck` | `tsc --noEmit` everywhere                            |
| `pnpm test`      | Vitest across all workspaces                         |
| `pnpm test:all`  | Lint + typecheck + test + format check               |
| `pnpm format`    | Prettier write                                       |
| `pnpm changeset` | Record a version bump for a publishable package      |
| `pnpm clean`     | Remove all build artifacts and `node_modules`        |

Scope to one workspace with `--filter`:

```bash
pnpm --filter @repo/api dev
pnpm --filter @repo/ui test
```

---

## Architecture

### Tilt owns local dev

Infra runs in containers; app dev servers run as native processes (`local_resource`) so Vite and
`tsx` keep their own fast file watching and HMR. `resource_deps` plus the Compose healthchecks mean
the API never starts against a Postgres that is not yet accepting connections.

The `check` resource (lint + typecheck + test) is manual-trigger — a button in the Tilt UI rather
than noise on every keystroke.

### `@repo/ui` resolves to source in dev

`packages/ui/package.json` declares a custom `@repo/source` export condition pointing at
`src/index.ts`, and `apps/web/vite.config.ts` asks for it via `resolve.conditions`. Editing a
component hot-reloads the browser with **no build step in between**. `tsconfig.json` `paths` keeps
the typechecker pointed at the same files, and `pnpm build` still emits `dist/` for publishing.

### Versions live in one place

`pnpm-workspace.yaml` holds a `catalog:` block. Workspaces reference `"react": "catalog:"`, so a
version bump is a one-line change instead of a grep across every `package.json`.

### The API proxy

`apps/web` proxies `/api` → `http://localhost:3001` in dev, so there is no CORS story locally and
the frontend can use relative URLs unchanged in production.

---

## Adding a Workspace

The quickest way is the built-in scaffolding CLI:

```bash
# Scaffold a shared library in packages/
pnpm create:package my-lib

# Scaffold a Node app in apps/
pnpm create:package my-service apps node

# Scaffold a React app in apps/
pnpm create:package my-app apps react
```

The command creates the directory with `package.json`, `tsconfig.json`, `eslint.config.js`,
`vitest.config.ts`, and a `src/index.ts` entry point — all wired to the shared configs.

**Syntax:** `pnpm create:package <name> [apps|packages] [node|react|lib]`

| Argument   | Default    | Description                                                   |
| ---------- | ---------- | ------------------------------------------------------------- |
| `name`     | (required) | Lowercase, hyphens allowed (e.g. `my-lib`)                    |
| `folder`   | `packages` | `apps` or `packages`                                          |
| `template` | `lib`\*    | `node` (Fastify-style), `react` (Vite SPA), `lib` (TS source) |

\*When `folder` is `apps`, the template defaults to `node` instead.

After scaffolding, run `pnpm install` to link the new workspace, then start developing:

```bash
pnpm install
pnpm --filter @repo/<name> dev
```

<details>
<summary><strong>Manual setup</strong></summary>

1. Create `apps/<name>` or `packages/<name>` with a `package.json` named `@repo/<name>`.
2. Extend a shared tsconfig: `"extends": "@repo/config/tsconfig/node"` (or `/react`).
3. Add `eslint.config.js` re-exporting `@repo/config/eslint` (or `/eslint/react`).
4. Give it `build` / `lint` / `typecheck` / `test` scripts so Turborepo picks it up.
5. Add new third-party versions to the `catalog:` in `pnpm-workspace.yaml`.
6. For a long-running service, add a `local_resource` to the `Tiltfile`.

</details>

---

## Environment

Copy `.env.example` to `.env`. Defaults match `docker-compose.yml`, so it works unedited:

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
REDIS_URL=redis://localhost:6379
```

The API validates its environment with Zod at startup (`apps/api/src/env.ts`) and exits with a
readable error rather than failing later.

---

## CI

`.github/workflows/ci.yml` runs format check, lint, typecheck, test, and build on every PR.
Uncomment the `TURBO_TOKEN` / `TURBO_TEAM` env block to enable Remote Caching.

---

## A Note on TypeScript 5.x

**This repo pins TypeScript 5.9.3 deliberately. Do not bump it to 7.x yet.**

TypeScript 7 is `latest`, but `typescript-eslint@8.68.0` peer-requires `typescript >=4.8.4 <6.1.0`.
Moving to 7 forces a peer override and silently drops type-aware lint rules — `no-floating-promises`
and `no-misused-promises` stop working, which is most of the value of linting a TypeScript codebase.
Revisit once typescript-eslint ships TS 7 support.

---

## License - test license

MIT — see [LICENSE](./LICENSE).
