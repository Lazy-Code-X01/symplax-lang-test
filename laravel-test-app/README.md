# Symplax Laravel Test App

A minimal Laravel app for testing PHP/Laravel deployment on Symplax.

## What this tests
- nixpacks/Kaniko PHP + Composer build detection
- Laravel artisan serve as the start command
- A working `/` route returning JSON
- A `/health` endpoint for health checks

## Routes
- `GET /` → `{ "message": "Laravel on Symplax", "status": "ok", ... }`
- `GET /health` → `{ "status": "healthy" }`

## Deploy on Symplax
1. Push this to a GitHub repo
2. Connect the repo in Symplax → Add App
3. Symplax will detect PHP/Composer automatically and run `composer install`
4. Start command: `php artisan serve --host=0.0.0.0 --port=$PORT`
5. On first boot, an `APP_KEY` will need to be generated — add a post-deploy
   command in Symplax: `php artisan key:generate --force`
