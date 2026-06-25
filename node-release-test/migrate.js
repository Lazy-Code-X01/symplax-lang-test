// Simulates a database migration — swap SHOULD_FAIL to test abort behavior
const SHOULD_FAIL = process.env.FORCE_MIGRATE_FAIL === 'true';

console.log('[migrate] Starting migration...');

if (SHOULD_FAIL) {
  console.error('[migrate] ERROR: Migration failed — simulated failure');
  process.exit(1);
}

console.log('[migrate] Step 1/3: Checking schema version...');
console.log('[migrate] Step 2/3: Applying pending migrations...');
console.log('[migrate] Step 3/3: Done.');
console.log('[migrate] Migration completed successfully');
process.exit(0);
