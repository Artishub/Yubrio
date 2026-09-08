# Supabase export and restore

Yubrio's database source of truth is the ordered migration set in
`supabase/migrations/`. It contains the tables, constraints, RLS policies,
realtime publication, and atomic mutation functions required by the app.

The configured Supabase project for this workspace is `Yubrio`. Keep this
migration folder as the portable backup and source of truth; the dashboard's
migration history may not include migrations run manually in SQL Editor.

## Create the Yubrio database in a new project

After creating the new Supabase project:

1. Install or run the current Supabase CLI.
2. Initialize CLI metadata if it is not already present: `npx supabase init`.
3. Link this folder to the new project: `npx supabase link --project-ref NEW_PROJECT_REF`.
4. Apply the migrations: `npx supabase db push`.
5. Copy the new project's URL and publishable/anon key into `.env`.
6. Add the configured auth callback URL in Supabase Auth settings.

The migrations must be applied in filename order. Do not paste individual
tables manually; the later migrations tighten the privacy rules from the
foundation migration.

## Export an existing Yubrio project's database

Run these commands from the repository. Replace `OLD_DB_URL` with the database
connection string from Supabase settings. Never commit that URL or a database
password.

```bash
mkdir -p supabase/backups
npx supabase db dump --db-url "$OLD_DB_URL" -f supabase/backups/schema.sql
npx supabase db dump --db-url "$OLD_DB_URL" --data-only --use-copy -f supabase/backups/data.sql
```

The schema dump is for database objects and the data dump is for rows. Supabase
managed `auth` and `storage` schemas are not included by the default dump.
Storage files need a separate download, and Auth users need a separate export
or recreation strategy. Do not use a database dump as a substitute for those.

## Restore a backup

For a brand-new project, prefer `npx supabase db push` from the migrations. Use
the SQL dump only when preserving an existing database that is not represented
by the migrations. Restore schema before data and review RLS/policies before
connecting the app.

## Free-plan project limit

Supabase allows two active free projects. A paused project does not count
toward that limit, so pausing an old project is safer than deleting it when we
are unsure whether its data is still needed. Deletion is irreversible; pause
or export first.
