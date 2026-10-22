# release-command-order

An app that **cannot start until its release command has run**. It exits on boot
if `/data/state.json` does not exist, and `node migrate.js` is what creates it.

That is the shape of any app that checks its database at startup, and it is the
case the old deploy order could not handle: the new version started first, crashed,
failed its health check, and the release command never got to run.

## Deploy it in Symplax

- Root path: `release-command-order`
- Port: 3000 (detected from `EXPOSE`)
- **Release command: `node migrate.js`**
- The volume `/data` is detected from the Dockerfile's `VOLUME`.

## What to check

1. **First deploy.** On agent 2.1.47 or newer it passes. The log shows
   `Running release command before the new version starts...`, then
   `release: applied migration 1`, and only after that `Booting shadow container...`.
   On an older agent it fails: the app crashes with `database is not migrated`.
   `/` answers `{"ok":true,"migrations":1,...}`.
2. **Redeploy.** `migrations` goes up by one each time, and `startedAt` changes.
3. **A failing release.** Add the env var `FAIL_RELEASE=1` and redeploy. The deploy
   must stop at the release command, the log must say the new version was not
   started and the previous one is still live, and `/` must keep answering with the
   old `startedAt` and the old `migrations` count. Remove the variable afterwards.
