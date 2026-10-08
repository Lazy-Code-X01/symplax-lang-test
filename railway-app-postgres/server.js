const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

/**
 * Fixture for the Railway import.
 *
 * The whole point is to make two things visible on one page: which database
 * this process is actually talking to, and how many rows are in it. Those two
 * facts together are what prove an import worked or quietly did not.
 *
 * The failure worth catching is an app that imports cleanly and keeps using
 * Railway's database. It looks like a successful migration for as long as
 * Railway keeps that database alive, and loses everything written in between.
 * `db.host` on `/` is the tell: after an import it must be a Symplax container
 * name, never a *.proxy.rlwy.net address.
 */

const connectionString = process.env.DATABASE_URL || '';
const pool = connectionString
  ? new Pool({
      connectionString,
      // Railway's Postgres template serves TLS with a certificate the client
      // will not chain to a public root, and the managed Postgres on a Symplax
      // server speaks plaintext on a private network. Accepting both is what
      // lets the same image run either side of the migration unchanged, which
      // is the only way this fixture tests anything.
      ssl: /sslmode=require|\.rlwy\.net|\.railway\.app/.test(connectionString)
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 8000,
    })
  : null;

/** Where this process believes its database lives, parsed from the URL it got. */
function describeDatabase() {
  if (!connectionString) return { configured: false };
  try {
    const u = new URL(connectionString);
    return {
      configured: true,
      host: u.hostname,
      port: u.port || '5432',
      database: u.pathname.replace(/^\//, ''),
      user: decodeURIComponent(u.username || ''),
      // The single most useful line in the whole fixture.
      looksLike: /\.rlwy\.net|\.railway\.app|railway/i.test(u.hostname)
        ? 'RAILWAY — this app is still using the old database'
        : 'not Railway',
    };
  } catch {
    return { configured: true, host: 'unparseable', looksLike: 'unknown' };
  }
}

/** Created on boot, never populated on boot. */
async function ensureTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id         SERIAL PRIMARY KEY,
      body       TEXT NOT NULL,
      created_on TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/', async (_req, res) => {
  const db = describeDatabase();

  // Echoed so a Railway import can be checked for variables it should not have
  // carried over. Anything starting RAILWAY_ appearing here after an import is
  // a bug: those name infrastructure that no longer exists for this app.
  const injected = {};
  for (const k of Object.keys(process.env)) {
    if (/^(DATABASE|DB|POSTGRES|PG|RAILWAY)_/.test(k) || k.endsWith('_URL')) {
      injected[k] = String(process.env[k]).replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    }
  }

  if (!pool) {
    return res.status(500).json({
      ok: false, app: 'railway-app-postgres', port, db, injected,
      error: 'DATABASE_URL is not set, so there is nothing to connect to.',
    });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, body, created_on, created_at FROM notes ORDER BY id DESC LIMIT 5'
    );
    const { rows: counted } = await pool.query('SELECT count(*)::int AS n FROM notes');
    res.json({
      ok: true, app: 'railway-app-postgres', port, db,
      rowCount: counted[0].n,
      // Zero here right after an import is correct and expected: Symplax
      // creates the database, it does not copy what was in the old one.
      note: counted[0].n === 0
        ? 'Empty. Either nothing was seeded yet, or this is a freshly created database.'
        : `${counted[0].n} row(s). Check created_on to see which database they were written against.`,
      sample: rows,
      injected,
    });
  } catch (err) {
    res.status(500).json({
      ok: false, app: 'railway-app-postgres', port, db, injected,
      error: String(err.message || err),
    });
  }
});

/**
 * Explicit, never automatic.
 *
 * Seeding on boot would defeat the fixture: the newly created Symplax database
 * would fill itself on first start and look exactly like a database whose data
 * had been migrated. Keeping it manual is what makes "arrives empty" something
 * you can see rather than something you have to take on trust.
 */
app.post('/seed', async (_req, res) => {
  if (!pool) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not set.' });
  const where = describeDatabase().host || 'unknown';
  try {
    await pool.query(
      `INSERT INTO notes (body, created_on) VALUES
         ('first note', $1), ('second note', $1), ('third note', $1)`,
      [where]
    );
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM notes');
    res.json({ ok: true, seededAgainst: where, rowCount: rows[0].n });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

/** Proves the new database accepts writes, not just reads. */
app.post('/notes', async (req, res) => {
  if (!pool) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not set.' });
  const body = typeof req.body?.body === 'string' ? req.body.body : 'note';
  try {
    const { rows } = await pool.query(
      'INSERT INTO notes (body, created_on) VALUES ($1, $2) RETURNING id, body, created_on, created_at',
      [body, describeDatabase().host || 'unknown']
    );
    res.status(201).json({ ok: true, inserted: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

app.listen(port, '0.0.0.0', async () => {
  const db = describeDatabase();
  console.log(`railway-app-postgres listening on ${port}`);
  console.log(`database host: ${db.host || '(none)'} — ${db.looksLike || 'not configured'}`);
  try {
    await ensureTable();
    console.log('notes table ready (empty unless seeded)');
  } catch (err) {
    // Not fatal: the app still starts and `/` reports the failure, which is
    // more useful during a migration than a container that will not boot.
    console.error('could not prepare the notes table:', err.message);
  }
});
