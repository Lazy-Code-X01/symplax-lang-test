const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Echo back what Symplax injected, so a passing deploy also proves the compose
// translation rewrote the connection details rather than passing through the
// service names from the file.
app.get('/', (req, res) => {
  const injected = {};
  for (const k of Object.keys(process.env)) {
    if (/^(DATABASE|DB|REDIS|POSTGRES|MYSQL|MONGO|CACHE)_/.test(k) || k.endsWith('_URL')) {
      injected[k] = String(process.env[k]).replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    }
  }
  res.json({ ok: true, app: 'compose-app-postgres-redis', port, injected });
});

app.listen(port, '0.0.0.0', () => console.log('compose-app-postgres-redis listening on ' + port));
