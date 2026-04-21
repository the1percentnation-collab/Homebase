# Homebase

A personal Home & Finance Command Center for you and your partner — budgets,
bills, goals, tasks, household life, all in one dashboard.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** (CSS-first config)
- **shadcn/ui** + **Radix** + **lucide-react**
- **Zustand** for client state, **react-hook-form + zod** for forms
- **Recharts** for charts, **date-fns** for dates
- Storage v1: **localStorage** (single-browser). v2: Supabase for multi-device sync.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

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
