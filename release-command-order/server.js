// An app that cannot start until its migrations have run, the way anything that
// checks its database at boot behaves. Before the release command ran first,
// this could never deploy: it crashed on start, the health check failed, and the
// release command that would have fixed it never got to run.
const fs = require('fs');
const http = require('http');

const DIR = process.env.DATA_DIR || '/data';
const FILE = `${DIR}/state.json`;

let state;
try {
  state = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch {
  console.error('FATAL: database is not migrated. Run the release command first.');
  process.exit(1);
}

const startedAt = new Date().toISOString();
const port = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, app: 'release-command-order', migrations: state.migrations, lastMigrationAt: state.lastMigrationAt, startedAt }));
  })
  .listen(port, () => console.log(`listening on ${port}, migrations applied: ${state.migrations}`));
