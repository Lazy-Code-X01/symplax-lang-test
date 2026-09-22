# Symplax deploy test matrix

Every folder is a self-contained app. Deploy each one in Symplax by pointing at
this repo and setting **Root path** to the folder name. Each app responds with
`{"ok": true, ...}` on `/`, so a passing health check = a successful deploy.

Two paths are being tested:

- **Auto-detect** — no Dockerfile; Symplax detects the language and generates one.
- **Dockerfile** — the app ships its own Dockerfile; Symplax builds it as-is.

## Bring-your-own-Dockerfile (the newly-expanded coverage)

| Root path                   | Lang / base                    | Port     | What it validates                                                                                  |
| --------------------------- | ------------------------------ | -------- | -------------------------------------------------------------------------------------------------- |
| `docker-node-prisma-alpine` | Node + Prisma on `node:alpine` | 3000     | **The "sub" case** — musl/openssl auto-patch so the Prisma engine loads. `/` does a real DB query. |
| `docker-node-volume-port`   | Node on `node:alpine`          | **5000** | Non-standard EXPOSE port detection **+** `VOLUME /data` persistent-volume detection.               |
| `docker-python-fastapi`     | Python on `python:3.11-slim`   | 8000     | Single-stage slim Python + `${PORT}` env in CMD.                                                   |
| `docker-go-multistage`      | Go → `alpine`                  | 8080     | Multi-stage build, static binary on a tiny runner.                                                 |
| `docker-rust-multistage`    | Rust → `debian-slim`           | 8080     | Multi-stage compile + slim runner (std-only, no crates).                                           |
| `docker-php-apache`         | `php:8.2-apache`               | **80**   | Single-stage, port 80 detection.                                                                   |
| `docker-static-nginx`       | `nginx:alpine`                 | **80**   | Static site via nginx — very common real-world Dockerfile.                                         |
| `node-release-test`         | Node (existing)                | —        | Existing Dockerfile app (release-command flow).                                                    |

## Auto-detect (no Dockerfile)

| Root path          | Detected as   | What it validates                                   |
| ------------------ | ------------- | --------------------------------------------------- |
| `python-fastapi`   | FastAPI       | Uvicorn CMD generation (completes the Python trio). |
| `python-flask`     | Flask         | Flask var detection + gunicorn.                     |
| `django-app`       | Django        | `manage.py` + `wsgi` module resolution.             |
| `java-maven`       | Java (Maven)  | `mvn package` build + JRE runner (heavier build).   |
| `go-http`          | Go            | Go build + listen-port detection.                   |
| `ruby-sinatra`     | Ruby          | Gemfile / Rack detection.                           |
| `laravel-test-app` | Laravel (PHP) | `artisan` detection.                                |
| `crash-test`       | Node          | Baseline Node auto-detect.                          |
| `nextjs-app`       | Next.js       | Framework label + build step.                       |
| `react-vite`       | Static (Vite) | Frontend build → static serve.                      |
| `static-html`      | Static HTML   | Plain HTML serve.                                   |

## Notes

- Every app binds `0.0.0.0` and honors `$PORT` where the generated image sets it.
- The Prisma app uses SQLite, so no external database is needed to test it.
- Java and Rust have the longest builds — expect them to be slower than the rest.

## Docker Compose import

Point Symplax at this repo, pick **Docker Compose** as the source, and set
**Root path** to the folder name. The deployable ones answer `{"ok": true, ...}`
on `/` and echo back whatever connection details were injected, with passwords
masked — so a passing health check proves both that it deployed and that the
compose service names were rewritten to the real provisioned credentials.

The refusals are as much the point as the successes. A compose file that is
half understood and deploys anyway is worse than one that does not deploy: the
app comes up quietly missing a worker and that is discovered in production.

| Root path                       | Services                  | Expected                                                              |
| ------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `compose-app-only`              | app                       | Deploys immediately. No database, no waiting.                          |
| `compose-app-postgres`          | web + postgres            | Provisions Postgres. `DATABASE_HOST` and `DATABASE_URL` both rewritten.|
| `compose-app-postgres-redis`    | api + postgres + redis    | Both provisioned and both URLs rewritten. `DBADMIN_HOST` left alone.   |
| `compose-refuse-worker`         | web + worker + postgres   | Refused, naming `web, worker`.                                         |
| `compose-refuse-two-apps`       | frontend + backend        | Refused, naming both.                                                  |
| `compose-refuse-db-only`        | mysql + valkey            | Refused, pointing at the Databases page.                               |
| `compose-warn-unsupported-keys` | app                       | Deploys, warns on `command`, `deploy`, `env_file`, networks, `${VAR}`. |

Two rewrites worth checking by eye on `compose-app-postgres-redis`:

- `DATABASE_URL` should be a **whole new URL**, not the file's URL with the host
  swapped. The username and password in the file belong to a container Symplax
  never creates, so reusing them would connect to the right server with the
  wrong credentials.
- `DBADMIN_HOST: dbadmin` must survive untouched. It contains the `db` service
  name as a substring and must not be treated as a reference to it.
