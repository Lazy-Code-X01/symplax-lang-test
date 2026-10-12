# digitalocean-fixtures

One App Platform app that exercises every branch of the DigitalOcean importer.

The Railway fixtures ask whether a connection string got repointed. This one
asks a second question Railway never raised: **what happens to a secret that
the provider will not give us?**

## The question this exists to answer

App Platform returns `EV[1:...]` ciphertext for any variable marked `SECRET`,
and keeps the key. There is no API that decrypts it. So an import cannot carry
those values, and the failure to design against is an app that arrives with its
secrets set to that ciphertext: it builds, it starts, and it fails on the first
authenticated call. That looks like a successful migration, which makes it
worse than a crash.

`web` reports which of the three outcomes it got for every variable:

| Outcome | Meaning |
| --- | --- |
| the real value | correct, for `GENERAL` variables |
| not set | correct, if you left the secret blank on the review step |
| `SEALED — …` | **the bug.** Ciphertext was carried across |

## Creating it

App Platform can build an app from a spec, which is one paste instead of a
dozen dashboard steps.

1. DigitalOcean → **Apps → Create App**
2. Either point it at this repo and let it offer the spec, or choose
   **Edit your App Spec** and paste [`app.yaml`](./app.yaml)
3. It will ask for a value for `API_SECRET`, because that is what a secret is
4. Deploy

**Cost.** App Platform bills hourly, so running this for an afternoon is
pennies, not a month's subscription. Destroy the app when the run is done.
The `instance_size_slug` in the spec is not verified; if DigitalOcean rejects
it, pick the cheapest Basic size in the UI.

## What is in it, and what each part proves

| Component | Kind | Expected in Symplax |
| --- | --- | --- |
| `web` | service, GitHub | **Imported.** Port 8080, health check `/health`, `GREETING` carried, `API_SECRET` asked for, `DATABASE_URL` repointed |
| `queue` | worker | **Imported, portless.** Must not be health-checked or uptime-probed |
| `nightly` | job, `SCHEDULED` | **Skipped**, reason names `0 3 * * *` |
| `docs` | static site | **Skipped**, no server to move |
| `db` | dev database | **Created empty.** No data carried |
| `ingress` | path routing | **Named as a loss.** `/api` and `/` share one hostname here; imported apps each get their own |

## What a pass looks like

Open `web` after importing:

```
ok: true
verdict: {
  sealedValues: [],            // nothing carried ciphertext
  stillOnDigitalOcean: [],     // nothing still points at *.ondigitalocean.com
  unset: ["API_SECRET"]        // only if you left it blank, which is fine
}
```

`GREETING` should read `hello-from-digitalocean`, and `DATABASE_URL` should
name a Symplax container, not `*.db.ondigitalocean.com`.

It returns **200 even when something is unset**, deliberately. An unset secret
is a legitimate outcome of declining to type one in, and returning 500 would
have the uptime monitor reporting a correct import as a failure. The Railway
multi-db fixture does return 500, and did exactly that.

## The open question this run should settle

A dev database (`production: false`) has no `cluster_name` and no UUID anywhere
in the app spec, and DigitalOcean's own upgrade instructions tell you to copy
the id out of the dashboard by hand. So it is unknown whether dev-database
clusters appear in `GET /v2/databases` at all, and whether their name can be
derived from the app.

That single fact decides whether dev databases are importable with their data
or permanently create-empty-only. This fixture is the cheapest way to find out.
