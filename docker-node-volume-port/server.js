const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;
const dataDir = '/data';

app.get('/', (req, res) => {
  // Prove the persistent volume is writable.
  let volumeOk = false;
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'ping.txt'), new Date().toISOString());
    volumeOk = true;
  } catch (e) {
    volumeOk = false;
  }
  res.json({ ok: true, app: 'docker-node-volume-port', port, volumeWritable: volumeOk });
});

app.listen(port, '0.0.0.0', () => console.log(`listening on ${port}`));
