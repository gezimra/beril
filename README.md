# BERIL Web

BERIL is a premium retail and service web platform for watches, eyewear, and repair operations in Gjilan, Kosovo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase client scaffolding
- React Hook Form + Zod

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Database Migrations (Supabase Stage)

Recommended flow (Supabase CLI):

```bash
supabase login
supabase link --project-ref qeuituvatklottkznrvq
supabase db push
```

Create a new migration file:

```bash
supabase migration new your_migration_name
```

Direct `psql` fallback (single migration file):

```bash
export SUPABASE_DB_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260310223000_admin_status_label_function.sql
```

Apply the hero slides schema migration (table + storage bucket):

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260310230000_hero_slides.sql
```

Apply ERP foundation migration (parts inventory, cashbook, watch master tables):

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260311110000_erp_foundation.sql
```

Apply repair parts consumption migration (work-order part usage + transactional stock consume function):

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260311123000_repair_parts_inventory_consumption.sql
```

Why migrations may not appear in Supabase migration history:
- If you run SQL directly with `psql`, schema changes are applied but Supabase CLI migration history is not updated.
- Use `supabase db push` when you want migration tracking in the dashboard/CLI history.

Verify the migration was applied:

```bash
psql "$SUPABASE_DB_URL" -c "select public.format_enum_label('out_for_delivery');"
psql "$SUPABASE_DB_URL" -c "select to_regclass('public.hero_slides');"
psql "$SUPABASE_DB_URL" -c "select id, public from storage.buckets where id = 'hero-slides';"
psql "$SUPABASE_DB_URL" -c "select to_regclass('public.inventory_items'), to_regclass('public.cashbook_entries');"
psql "$SUPABASE_DB_URL" -c "select to_regclass('public.watch_brands'), to_regclass('public.watch_calibers'), to_regclass('public.watch_models'), to_regclass('public.watch_references');"
psql "$SUPABASE_DB_URL" -c "select to_regprocedure('public.consume_inventory_for_work_order(uuid, uuid, integer, numeric, text)');"
```

## Planning Docs

The implementation roadmap is in:

- `/docs/build-plan/README.md`
- `/docs/build-plan/01-foundation.md` through `/docs/build-plan/08-v2-backlog.md`
