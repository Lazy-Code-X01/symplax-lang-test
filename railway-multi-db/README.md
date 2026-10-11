# railway-multi-db

One app, three database engines. `railway-app-postgres` proves that *a*
database gets repointed; this proves it happens for **every** database in a
project, independently, and that each one is created as the right engine.

Those are different claims. A planner that repoints the first reference it
finds, or that maps every database image to Postgres, passes the
one-database test and fails this one.

## No dependencies, on purpose

It does not query MySQL, Redis or Mongo. It parses each connection string and
opens a TCP connection to the host. That distinguishes a repointed URL from a
stale one, which is the thing an import can get wrong, and it keeps the build
fast and the Railway bill small.

So `reachable: true` means *something answered on that host and port*. It does
not mean the credentials are right. Checking that is what
`railway-app-postgres` is for, and it only needs doing once.

## Setting it up on Railway

1. New project from this repo, root directory `railway-multi-db`.
2. Add three databases: **MySQL**, **Redis**, **MongoDB**
   (New → Database → each one).
3. On the app service, set three variables. Type the references, do not paste
   resolved values, because the import reads the reference to know which
   service it points at:

   | Variable | Value |
   | --- | --- |
   | `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` |
   | `REDIS_URL` | `${{Redis.REDIS_URL}}` |
   | `MONGO_URL` | `${{MongoDB.MONGO_URL}}` |

4. On **each** database service: Settings → Networking → Public Access.
   Without it there is no route to the data and Symplax blocks the import,
   which is correct and is its own test.
5. Open the app. Every entry should read `looksLike: "RAILWAY — ..."`.
   That is the "before" picture.

## What a pass looks like after importing

```
ok: true
verdict: {
  missing: [],              // all three variables arrived
  stillOnRailway: [],       // none still points at *.rlwy.net
  unreachable: [],          // all three Symplax containers answered
  railwayVarsLeaked: []     // no RAILWAY_* came across
}
```

And in the Symplax dashboard: three databases on the Databases page, named
`<project>-mysql`, `<project>-redis`, `<project>-mongodb`, each with the right
engine icon.

## Worth checking on the review screen before you import

- All three appear under **Will be created**, each with its own engine icon,
  not three identical ones.
- The Redis row does **not** claim a database name; Redis has no concept of one.
- Each row names the variable wired into it, and the three do not get mixed up.
- The app row is two lines, not five.
