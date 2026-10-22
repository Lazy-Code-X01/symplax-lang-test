// The release command. Writes the "database" the app needs before it can start.
//
// The state lives on /data, a volume, so the app container sees what this
// one-off container wrote. Set FAIL_RELEASE=1 to make it fail on purpose.
const fs = require('fs');

const DIR = process.env.DATA_DIR || '/data';
const FILE = `${DIR}/state.json`;

console.log('release: starting migration');

if (process.env.FAIL_RELEASE === '1') {
  console.error('release: FAIL_RELEASE=1, failing on purpose');
  process.exit(1);
}

fs.mkdirSync(DIR, { recursive: true });
let state = { migrations: 0 };
try {
  state = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch {
  console.log('release: no state found, this is the first migration');
}

state.migrations += 1;
state.lastMigrationAt = new Date().toISOString();
fs.writeFileSync(FILE, JSON.stringify(state));
console.log(`release: applied migration ${state.migrations}`);
