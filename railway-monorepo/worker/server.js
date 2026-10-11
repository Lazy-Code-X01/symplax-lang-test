const http = require('http');
const { URL } = require('url');

/**
 * Fixture for a Railway project whose services both live in one repository.
 *
 * Two things are under test here that a single-service project cannot reach.
 *
 * The first is the root directory. Railway stores it with a leading slash, as
 * `/railway-monorepo/web`, and storing that raw makes the builder `cd` to an
 * absolute path, which fails, leaves the build at the repository root and then
 * reports that the language could not be detected. One service getting this
 * right is luck; two services at two different depths is the test.
 *
 * The second is a database shared by more than one app. Both services here
 * read the same Postgres, so the import has to repoint two references at one
 * newly created database, and the review screen has to describe a database
 * that more than one thing depends on.
 *
 * `/` says which folder this process was built from, so a build that silently
 * ran at the repository root is visible rather than merely broken.
 *
 * This is the worker half. It serves HTTP for the same reason the web half
 * does: Symplax health-checks a container's port, and a process with no port
 * would be reported as a failed deploy for a reason that has nothing to do
 * with the import being tested.
 */

const port = process.env.PORT || 3000;
const ROLE = 'worker';
const EXPECTED_DIR = 'railway-monorepo/worker';

const RAILWAY_HOST = /\.rlwy\.net|\.railway\.app|railway\.internal/i;

function describeDatabase() {
  const raw = process.env.DATABASE_URL || '';
  if (!raw) return { configured: false };
  try {
    const u = new URL(raw);
    const stillRailway = RAILWAY_HOST.test(u.hostname);
    return {
      configured: true,
      host: u.hostname,
      port: u.port || '5432',
      database: u.pathname.replace(/^\//, ''),
      looksLike: stillRailway
        ? 'RAILWAY — this app is still using the old database'
        : 'not Railway',
      stillRailway,
    };
  } catch {
    return { configured: true, host: 'unparseable', looksLike: 'unknown', stillRailway: false };
  }
}

/**
 * Whether the build used this folder as its context.
 *
 * Not `__dirname`: the builder copies the root directory's CONTENTS to /app, so
 * a correct build and one that ignored the root directory both report /app.
 * The first version of this fixture checked that and reported every correct
 * build as wrong.
 *
 * What does distinguish them is what is sitting next to this file. Built from
 * this folder, that is server.js and package.json and nothing else. Built from
 * the repository root, it would be every other fixture folder in the repo, so
 * finding any of them here means the root directory was ignored.
 */
const SIBLING_FIXTURES = ['django-app', 'railway-multi-db', 'compose-app-only', 'python-flask'];

function buildContext() {
  let entries = [];
  try {
    entries = require('fs').readdirSync(__dirname);
  } catch {
    return { directory: __dirname, correct: false, reason: 'could not read the build directory' };
  }
  const strays = entries.filter((e) => SIBLING_FIXTURES.includes(e));
  return {
    directory: __dirname,
    sourceFolder: EXPECTED_DIR,
    contents: entries.filter((e) => e !== 'node_modules').sort(),
    // Proof by absence: none of the repository's other folders came along.
    correct: strays.length === 0 && entries.includes('server.js'),
    strays,
  };
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  const db = describeDatabase();
  const build = buildContext();
  const injected = {};
  for (const k of Object.keys(process.env)) {
    if (/^(RAILWAY)_/.test(k) || k.endsWith('_URL')) {
      injected[k] = String(process.env[k]).replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    }
  }

  const body = {
    ok: db.configured && !db.stillRailway && build.correct,
    app: `railway-monorepo-${ROLE}`,
    role: ROLE,
    port,
    build,
    db,
    sharedWith: 'railway-monorepo-web reads this same database',
    injected,
  };
  res.writeHead(body.ok ? 200 : 500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
});

server.listen(port, '0.0.0.0', () => {
  const build = buildContext();
  console.log(`railway-monorepo-${ROLE} listening on ${port}`);
  console.log(`built from: ${build.directory} (${build.correct ? 'correct' : 'WRONG DIRECTORY'})`);
  console.log(`database host: ${describeDatabase().host || '(none)'}`);
});
