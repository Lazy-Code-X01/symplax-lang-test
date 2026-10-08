# railway-app-postgres

A migration fixture: one app, one Postgres, the shape most people arrive with.

It exists to make two facts visible on a single page, because together they are
what proves an import worked:

- **which database this process is actually talking to** (`db.host`)
- **how many rows are in it** (`rowCount`)

## The failure this is built to catch

An app that imports cleanly and carries on using Railway's database. It looks
like a successful migration for as long as Railway keeps that database alive,
and silently loses everything written in the meantime. After an import,
`db.host` must be a Symplax container name. If it still ends in
`.proxy.rlwy.net`, the import did not repoint the connection string.

## It never seeds itself

The table is created on boot; rows are only ever inserted by `POST /seed`.

That is deliberate. If it seeded on startup, the freshly created Symplax
database would fill itself on first boot and look exactly like a database whose
data had been migrated. Keeping it manual is what makes "databases arrive
empty" something you can see rather than take on trust.

## Endpoints

| | |
| --- | --- |
| `GET /` | Database host, row count, last 5 rows, and any `DATABASE_*` / `RAILWAY_*` variables, passwords masked |
| `GET /health` | `{ok:true}` |
| `POST /seed` | Inserts 3 rows tagged with the host they were written against |
| `POST /notes` | Inserts one row, proving the new database takes writes |

## Running the test

**On Railway**

1. New project from this repo, root directory `railway-app-postgres`.
2. Add a Postgres (New → Database → Postgres).
3. On the app service, set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`.
   Type the reference, don't paste a resolved value: the import reads the
   reference to know which service it points at.
4. Open the app, `POST /seed`, then `GET /` and confirm `rowCount: 3` with
   `created_on` showing a `.proxy.rlwy.net` host.

**Enable the public endpoint**

In Railway, on the Postgres service: Settings → Networking → Public Access.
Without it Railway publishes no `DATABASE_PUBLIC_URL` and there is no route to
the data at all, which is why the Symplax import flags it as a blocker.

Worth running the import **once before** enabling it, purely to confirm that
blocker appears and that the Import button stays disabled.

**On Symplax**

5. Integrations → Railway → connect a token → pick the project.
6. On the review step, check it says: one app, one Postgres, `DATABASE_URL`
   will point at the new database, and that the databases arrive empty.
7. Import, then open the app.

## What a pass looks like

- `db.host` is a Symplax container name, **not** `*.proxy.rlwy.net`
- `db.looksLike` reads `not Railway`
- `rowCount` is **0** — the new database was created, not copied
- `injected` contains `DATABASE_URL` and **no `RAILWAY_*` variables at all`**
- `POST /notes` then `GET /` shows the row, so the new database takes writes
- Railway still has its 3 rows, untouched

That last point matters as much as the rest: an import must not change anything
on the other side.
