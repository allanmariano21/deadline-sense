# Deadline Sense

A flashy, friendly academic workload manager for students who don't just need a to-do list — they need to know **what to do right now**.

Built with Next.js 16 (App Router), Tailwind CSS v4, Framer Motion, and Supabase.

## What it does

- **Smart priority engine** — every task is scored by deadline urgency, workload pressure, and difficulty. The list re-sorts itself as deadlines approach.
- **"What should I do right now?"** — pick your time available and energy level; it suggests the best-fit task.
- **Cram risk indicator** — surfaces which tasks will turn into late-night cram sessions if you keep delaying.
- **Academic health dashboard** — at-a-glance view of *on track / at risk / overloaded*.
- **Schema-ready for group projects** — shared task boards via Supabase RLS.
- **Cute by default** — gradient text, soft glass cards, spring animations, confetti on complete.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs in **local-only mode** out of the box (sample tasks + `localStorage`) so you can play with it before wiring up Supabase.

## Wiring up Supabase (free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   Both come from **Project Settings → API**.
3. Open the Supabase **SQL editor** and run [`supabase/schema.sql`](supabase/schema.sql). It creates `tasks`, `class_blocks`, `task_groups`, and `task_group_members` with row-level security policies tied to `auth.uid()`.
4. Restart `npm run dev`. The local-only banner at the bottom of the page will disappear once the keys are detected.

> Auth, real-time sync, and the actual fetch/persist hooks are not wired into the UI yet — the Supabase client (`src/lib/supabase/client.ts`) is ready, the schema is ready, but `Dashboard.tsx` still uses sample data + `localStorage`. That's the natural next step.

## Project layout

```
src/
  app/
    layout.tsx         # global shell, fonts, metadata
    page.tsx           # renders <Dashboard />
    globals.css        # Tailwind v4 + custom gradient mesh + theme tokens
  components/
    Dashboard.tsx      # client root, state, persistence, confetti
    Header.tsx         # animated greeting + status chip
    SmartSuggestion.tsx# the "what now?" hero card
    AcademicHealth.tsx # weekly health bar
    TaskCard.tsx       # priority-sorted task card with cram-risk chip
    AddTaskDialog.tsx  # FAB + bottom-sheet/modal task creator
  lib/
    types.ts           # Task, EnergyLevel, ClassBlock, etc.
    priority.ts        # scoring algorithm + cram risk + suggestion
    sample-tasks.ts    # demo data
    utils.ts           # cn(), formatters
    supabase/
      client.ts        # browser client (lazy, optional)
      server.ts        # server client (cookies-aware)
supabase/
  schema.sql           # tables, indexes, RLS policies
```

## Priority algorithm

Lives in [`src/lib/priority.ts`](src/lib/priority.ts). For each active task:

```
urgency           = clamp(1 - hoursUntilDue / 168, 0, 1)   // 1 week away ≈ 0
workloadPressure  = min(1, hoursRemaining / hoursUntilDue)
difficulty        = task.difficulty / 5

score = 0.55 * urgency + 0.30 * workloadPressure + 0.15 * difficulty
```

Cram risk compares remaining work against a realistic 2.5 h/day study budget. Tweak the weights to taste.

## Stack

- **Next.js 16** + Turbopack (App Router, React 19)
- **Tailwind CSS v4** with `@theme inline` tokens
- **Framer Motion 12** for spring animations and layout transitions
- **lucide-react** for icons, **canvas-confetti** for celebrations
- **@supabase/ssr** + **@supabase/supabase-js**

## Deploy

Anywhere that runs Next.js (Vercel, Netlify, self-hosted). Set the two `NEXT_PUBLIC_SUPABASE_*` env vars in the host's project settings.
