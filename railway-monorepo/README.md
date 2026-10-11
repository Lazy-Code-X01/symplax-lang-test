# railway-monorepo

Two services from one repository, sharing one Postgres. Two things are under
test that a single-service project cannot reach.

**The root directory.** Railway stores it with a leading slash, as
`/railway-monorepo/web`. Stored raw it becomes an absolute path in the
builder's `cd`, which fails, leaves the build at the repository root, and then
reports that the language could not be detected. That bug was real and shipped.
One service getting it right is luck; two services at two different depths is
the test.

`GET /` returns the directory the process is actually running from, so a build
that silently ran at the repository root is visible rather than merely broken:

```json
"build": { "directory": "/app/railway-monorepo/web", "correct": true }
```

**A database more than one app depends on.** Both services read the same
Postgres, so the import has to repoint two references at one newly created
database, and the review screen has to describe a database with two dependants
without duplicating it or losing one.

## Setting it up on Railway

1. New project from this repo. Set the first service's root directory to
   `railway-monorepo/web`.
2. Add a **second service from the same repo** (New → GitHub Repo → this repo
   again), root directory `railway-monorepo/worker`.
3. Add a Postgres.
4. On **both** services set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`.
   Type the reference, do not paste a resolved value.
5. Postgres → Settings → Networking → Public Access.
6. Open both services and confirm each reports its own `build.directory` and
   `looksLike: "RAILWAY — ..."`.

## What a pass looks like after importing

Both apps:

```
ok: true
build.correct: true          // and the two directories differ
db.looksLike: "not Railway"
db.host: the same Symplax container for both
```

Two apps and one database in Symplax, both apps pointing at that one database.

## Worth checking on the review screen before you import

- Two app rows, each showing **its own** root directory in parentheses.
  If both show the same one, or neither shows one, stop there.
- One database row, not two.
- The database row names `DATABASE_URL` once, not twice.
- The Import button says "2 apps and 1 database".

## The second run: name clashes

Import the same project again without deleting anything. Both apps should now
be blocked with their own amber card and their own rename control, and the
Import button should stay disabled until both are renamed. Renaming one should
not clear the other.
