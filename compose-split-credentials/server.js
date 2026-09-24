const express = require('express');
const { Client } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Every field separately, which is the whole point: none of these came from a
// connection string, so each one had to be rewritten on its own.
const cfg = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// 200 only on a real query. If the rewrite missed any field, Postgres refuses
// the connection and the deploy's health check fails rather than going green
// on an app that cannot reach its database.
app.get('/', async (_req, res) => {
  const client = new Client({ ...cfg, connectionTimeoutMillis: 4000 });
  try {
    await client.connect();
    const { rows } = await client.query('select current_database() as db, current_user as usr');
    res.json({
      ok: true,
      app: 'compose-split-credentials',
      connectedAs: rows[0],
      // Echoed so a passing deploy also shows what the values were rewritten
      // to, not just that they worked.
      using: { host: cfg.host, port: cfg.port, user: cfg.user, database: cfg.database },
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      error: String(err.message || err),
      using: { host: cfg.host, port: cfg.port, user: cfg.user, database: cfg.database },
    });
  } finally {
    client.end().catch(() => {});
  }
});

app.listen(port, '0.0.0.0', () => console.log('compose-split-credentials listening on ' + port));
