const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    // Touch the DB so the Prisma musl query-engine actually has to load.
    // If openssl wasn't present on the Alpine image, this throws at startup.
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, app: 'docker-node-prisma-alpine', engine: 'loaded' });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.listen(port, '0.0.0.0', () => console.log(`listening on ${port}`));
