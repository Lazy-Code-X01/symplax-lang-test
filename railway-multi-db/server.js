const http = require('http');
const net = require('net');
const { URL } = require('url');

/**
 * Fixture for a Railway import with more than one kind of database.
 *
 * `railway-app-postgres` proves one database gets repointed. This proves the
 * importer does it for every database in a project, independently, and that it
 * picks the right engine for each. Those are different claims: a planner that
 * repoints the first reference it finds, or that maps every database image to
 * Postgres, passes the one-database test and fails here.
 *
 * Deliberately has no dependencies. It does not query MySQL, Redis or Mongo,
 * it opens a TCP connection to each host and reports whether something
 * answered. That is enough to tell a repointed connection string from a stale
 * one, which is what an import can get wrong, and it keeps the image small and
 * the build fast, which is what keeps this cheap to run on Railway.
 */

const port = process.env.PORT || 3000;

/** The variables an import has to repoint, and what each should end up as. */
const EXPECTED = [
  { key: 'MYSQL_URL', engine: 'MySQL', defaultPort: 3306 },
  { key: 'REDIS_URL', engine: 'Redis', defaultPort: 6379 },
  { key: 'MONGO_URL', engine: 'MongoDB', defaultPort: 27017 },
];

/** Railway's own hostnames, which must not survive an import. */
const RAILWAY_HOST = /\.rlwy\.net|\.railway\.app|railway\.internal/i;

function describe(raw, defaultPort) {
  if (!raw) return { configured: false };
  try {
    const u = new URL(raw);
    const stillRailway = RAILWAY_HOST.test(u.hostname);
    return {
      configured: true,
      host: u.hostname,
      port: Number(u.port || defaultPort),
      database: u.pathname.replace(/^\//, '') || null,
      // The single most useful field here, same as the Postgres fixture.
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
 * Whether anything is listening, without speaking any database's protocol.
 *
 * A repointed URL that names a container nothing is serving is just as broken
 * as one still pointing at Railway, and it fails in a way that looks like the
 * app's fault rather than the import's.
 */
function reachable(host, port, timeout = 4000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

async function report() {
  const databases = {};
  for (const { key, engine, defaultPort } of EXPECTED) {
    const info = describe(process.env[key], defaultPort);
    databases[key] = { engine, ...info };
    if (info.configured && info.host && info.host !== 'unparseable') {
      databases[key].reachable = await reachable(info.host, info.port);
    }
  }

  // Echoed so an import can be checked for variables it should not have
  // carried. Anything starting RAILWAY_ here after an import names
  // infrastructure this app no longer runs on.
  const injected = {};
  for (const k of Object.keys(process.env)) {
    if (/^(RAILWAY)_/.test(k) || k.endsWith('_URL')) {
      injected[k] = String(process.env[k]).replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    }
  }

  const missing = EXPECTED.filter((e) => !databases[e.key].configured).map((e) => e.key);
  const stale = EXPECTED.filter((e) => databases[e.key].stillRailway).map((e) => e.key);
  const unreachable = EXPECTED.filter(
    (e) => databases[e.key].configured && databases[e.key].reachable === false
  ).map((e) => e.key);

  return {
    ok: missing.length === 0 && stale.length === 0 && unreachable.length === 0,
    app: 'railway-multi-db',
    port,
    databases,
    verdict: {
      missing,
      stillOnRailway: stale,
      unreachable,
      railwayVarsLeaked: Object.keys(injected).filter((k) => k.startsWith('RAILWAY_')),
    },
    injected,
  };
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }
  const body = await report();
  res.writeHead(body.ok ? 200 : 500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
});

server.listen(port, '0.0.0.0', async () => {
  console.log(`railway-multi-db listening on ${port}`);
  const body = await report();
  for (const [key, db] of Object.entries(body.databases)) {
    console.log(`${key}: ${db.host || '(not set)'} — ${db.looksLike || 'not configured'}`);
  }
});
