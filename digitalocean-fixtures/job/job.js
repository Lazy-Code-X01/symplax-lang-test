/**
 * An App Platform job: runs, prints, exits.
 *
 * `kind: SCHEDULED` with a cron expression is the branch worth testing, and
 * the planner skips it the same way it skips a Railway cron service, naming
 * the schedule so it can be recreated on the app's Cron tab.
 *
 * The other kinds, PRE_DEPLOY and POST_DEPLOY, are deploy hooks with no
 * equivalent in Symplax at all, and they are skipped for a different stated
 * reason. Changing `kind` in the app spec is how you test that one.
 */
console.log(`do-fixture-job ran at ${new Date().toISOString()}`);
console.log(`APP_URL=${process.env.APP_URL || '(none)'}`);
process.exit(0);
