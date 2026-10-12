const http = require('http');
const { URL } = require('url');

/**
 * Fixture for importing a DigitalOcean App Platform app.
 *
 * The Railway fixtures ask one question: did the connection string get
 * repointed. This one asks a second that Railway never raised, because
 * DigitalOcean answers it differently.
 *
 * App Platform returns `EV[1:...]` ciphertext for any variable marked SECRET
 * and keeps the key itself. So an import cannot carry those values, and the
 * failure to design against is an app that arrives with its secrets set to
 * that ciphertext: it builds, it starts, and it fails on the first
 * authenticated call. That looks like a successful migration, which makes it
 * worse than a crash.
 *
 * `/` reports what each expected variable actually holds, so the three
 * outcomes are distinguishable at a glance: the real value, nothing at all,
 * or the sealed envelope that must never arrive.
 */

const port = process.env.PORT || 8080;

/** What the app spec sets, and what each one is here to prove. */
const EXPECTED = [
  { key: 'GREETING', kind: 'GENERAL', expect: 'imported with its real value' },
  { key: 'BUILD_FLAG', kind: 'BUILD_TIME', expect: 'reaches the build, not necessarily the container' },
  { key: 'API_SECRET', kind: 'SECRET', expect: 'supplied during the import, or left unset' },
  { key: 'DATABASE_URL', kind: 'BINDING', expect: 'repointed at the Symplax database' },
];

/** The shape DigitalOcean hands back for a value it will not decrypt. */
const SEALED = /^EV\[1:/;

/** Hosts that mean this app is still talking to DigitalOcean. */
const DO_HOST = /\.ondigitalocean\.app|\.db\.ondigitalocean\.com|\.digitaloceanspaces\.com/i;

function describe(key) {
  const raw = process.env[key];
  if (raw === undefined) return { set: false, verdict: 'not set' };
  if (SEALED.test(raw)) {
    // The one outcome that must never happen.
    return { set: true, verdict: 'SEALED — the import carried ciphertext it cannot decrypt', sealed: true };
  }
  const masked = raw.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  const stillDigitalOcean = DO_HOST.test(raw);
  return {
    set: true,
    value: raw.length > 80 ? `${masked.slice(0, 80)}…` : masked,
    stillDigitalOcean,
    verdict: stillDigitalOcean
      ? 'DIGITALOCEAN — this app is still using the old infrastructure'
      : 'set',
  };
}

function report() {
  const variables = {};
  for (const e of EXPECTED) variables[e.key] = { ...e, ...describe(e.key) };

  const sealed = EXPECTED.filter((e) => variables[e.key].sealed).map((e) => e.key);
  const stillThere = EXPECTED.filter((e) => variables[e.key].stillDigitalOcean).map((e) => e.key);
  const unset = EXPECTED.filter((e) => !variables[e.key].set).map((e) => e.key);

  return {
    // A sealed value or a DigitalOcean host is a failure. An unset secret is
    // not: it is the documented outcome of declining to type one in.
    ok: sealed.length === 0 && stillThere.length === 0,
    app: 'do-fixture-web',
    port,
    variables,
    verdict: { sealedValues: sealed, stillOnDigitalOcean: stillThere, unset },
    note: unset.length
      ? `${unset.join(', ')} unset. Expected if you left the secret blank on the review step.`
      : 'every expected variable arrived',
  };
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }
  const body = report();
  // 200 either way. An unset secret is a legitimate outcome here, and
  // returning 500 for it would have the uptime monitor calling a correct
  // import a failure, which is exactly what the Railway fixture did.
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
});

server.listen(port, '0.0.0.0', () => {
  const body = report();
  console.log(`do-fixture-web listening on ${port}`);
  for (const [key, v] of Object.entries(body.variables)) {
    console.log(`${key} (${v.kind}): ${v.verdict}`);
  }
});
