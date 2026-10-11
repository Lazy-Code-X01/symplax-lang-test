# railway-edge-cases

A project built to be mostly **un**-importable. Everything above tests that a
good project imports; this tests that a bad one is refused clearly, which is
the half a user sees when something is wrong and the half that is never
exercised by accident.

Only one folder of code lives here. The rest is Railway-side configuration,
because the branches being tested are about services Symplax will not import,
and services it will not import do not need source to be written.

## The five cases, in one project

| # | Add this in Railway | Expected in Symplax |
| --- | --- | --- |
| 1 | A service from this repo, root `railway-edge-cases/cron`, with a schedule (Settings → Cron Schedule, `0 3 * * *`) | **Skipped**, reason names the schedule `0 3 * * *` |
| 2 | A service from the Docker image `nginx:alpine` (New → Docker Image) | **Skipped**, "not a database Symplax provisions… deploy it separately as an app from an image" |
| 3 | A Redis, with **Public Access left off** | **Blocked**, amber card saying to enable TCP Proxy, Import stays disabled |
| 4 | An app service with `CACHE_URL` set to `${{Redis.REDIS_URL}}` where that Redis is case 3 | Reference reported as **left unset**, since the thing it reads from is not coming across |
| 5 | A second environment (Settings → Environments → New, call it `staging`) | Only `production` imported, and the review says the other environment is not |

Cases 1 and 2 cost almost nothing to run: the cron service exits immediately,
and nginx idles.

## Running it

1. New project from this repo, root directory `railway-edge-cases/cron`,
   then give that service the cron schedule. It will run once and exit, which
   is correct.
2. Add the other services as above.
3. Import in Symplax **without fixing anything**.

## What a pass looks like

The review step shows **only** blockers, no "Will be created" list, because
nothing can be created until they are resolved. Each blocked service is its
own amber card with its own message. The Import button is disabled.

Then enable Public Access on the Redis and refresh the plan. The blockers
clear, the review appears, and the skipped services are listed under
**Will not be imported** with their individual reasons.

## The one that is easy to get wrong

Case 4. After importing, the app must start with `CACHE_URL` **absent or
unset**, never carrying Railway's resolved value. A variable that quietly
arrives pointing at a Railway Redis is worse than one that is missing: the app
starts, works, and depends on infrastructure the user believes they have left.
