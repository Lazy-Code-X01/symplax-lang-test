/**
 * A Railway cron service: runs, prints, exits.
 *
 * Railway marks a service as scheduled by setting `cronSchedule` on it, and
 * the Symplax importer skips any service that has one, naming the schedule so
 * it can be recreated on the app's Cron tab. That branch is covered by the
 * unit tests against a fake Railway; what it cannot cover is whether a real
 * Railway cron service actually reports `cronSchedule` on its service instance
 * in the way the planner expects.
 *
 * It exits deliberately. A cron service that stays up is billed as though it
 * were always running, which is the opposite of what this fixture is for.
 */
const now = new Date().toISOString();
console.log(`railway-edge-cases/cron ran at ${now}`);
console.log(`RAILWAY_ENVIRONMENT_NAME=${process.env.RAILWAY_ENVIRONMENT_NAME || '(none)'}`);
process.exit(0);
