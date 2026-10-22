# 💸 Personal Finance Tracker

It's a full-stack web app for tracking your finances. Easily manage income, expenses, and accounts — built with modern technologies like Next.js, Drizzle ORM, React Query, Zustand, and Tailwind CSS.

---

## 🚀 Features

- 📥 Add, edit, and delete transactions
- 🏦 Manage accounts and categories
- 📊 Dashboard with income, expenses, net balance and spending by category
- 📅 Filter by account and date range (with quick presets)
- 📄 Import bank CSVs with column mapping, format detection and row-level validation
- ⬇️ Export all transactions to CSV
- 🌗 Light, dark and system themes
- 💱 Choose your display currency
- 🔐 Every API request is scoped to the signed-in user

---

## 🛠 Tech Stack

- **Framework**: Next.js (App Router) with a Hono API
- **Auth**: Clerk
- **Database**: Postgres (Neon) with Drizzle ORM
- **Validation**: Zod (shared by forms and API)
- **Client State**: Zustand
- **Server State**: React Query
- **Styling**: Tailwind CSS + shadcn/ui
- **Tests**: Vitest, PGlite (in-memory Postgres), Testing Library

---

## ⚙️ Getting started

1. Install dependencies (the lockfile needs legacy peer resolution):

   ```bash
   npm ci --legacy-peer-deps
   ```

2. Copy `.env.example` to `.env.local` and fill in your Neon database URL and Clerk keys. Use a **development** database and Clerk instance.

3. Apply migrations and start the dev server:

   ```bash
   npm run db:migrate
   npm run dev
   ```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the test suite (no database or credentials needed) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration from `db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

### Seeding demo data

The seed script **replaces one user's data** and refuses to run unless you opt in explicitly. It never runs in production and never touches other users' rows:

```bash
ALLOW_DESTRUCTIVE_SEED=true SEED_USER_ID=user_xxx npm run db:seed
```

---

## 📂 Project Structure

```text
├── app/          # Routes, layouts and the Hono API (app/api/[[...route]])
├── components/   # Shared UI (shell, charts, tables) and shadcn/ui primitives
├── features/     # Accounts, categories, transactions: API hooks, forms, sheets
├── db/           # Drizzle schema and shared validation schemas
├── drizzle/      # SQL migrations
├── hooks/        # Shared React hooks
├── lib/          # Utilities: dates, currency, CSV import/export, API helpers
├── scripts/      # Migration and (guarded) seed scripts
└── tests/        # API security, unit and component tests
```

---

✅ Todo
 Add paywall

🙋‍♀️ Author
Built with ❤️ by Christian
Inspired by Code with antonio
