const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Symplax release command test app',
    version: process.env.APP_VERSION || '1.0.0',
    migrated: process.env.MIGRATION_DONE === 'true',
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

 
// retry
// v3
// v4
// v5
// v6
