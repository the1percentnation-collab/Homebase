# Homebase

A personal Home & Finance Command Center for you and your partner — budgets,
bills, goals, tasks, household life, all in one dashboard.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** (CSS-first config)
- **shadcn/ui** + **Radix** + **lucide-react**
- **Zustand** for client state, **react-hook-form + zod** for forms
- **Recharts** for charts, **date-fns** for dates
- Storage: **localStorage** by default. Set the Supabase env vars below to
  switch to cloud sync — same interface, no feature code changes.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Cloud sync (optional)

Copy `.env.local.example` to `.env.local` and fill in a Supabase project's
URL and anon key. Tables, RLS policies, and auth land in later tasks; adding
the env vars alone just switches which `StorageAdapter` the app uses.

```bash
cp .env.local.example .env.local
# edit .env.local with your Supabase URL + anon key
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run typecheck` — TS check only
- `npm run lint` — ESLint

## Roadmap

See the task plan in the project history. Shipping order:

1. ~~Scaffolding~~ ✅
2. App shell + dashboard homepage
3. Finances → Expense Tracker, Budgets, Bills
4. Home → Tasks & Chores
5. Iterate on remaining modules (Income, Goals, Debt, Net Worth, Maintenance,
   Inventory, Family, Pets, Vehicles, Documents, Insurance, Health, Reports)
