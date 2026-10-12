/**
 * An App Platform worker: a long-running process with no port.
 *
 * It exists to prove one thing. DigitalOcean's spec puts workers in their own
 * array precisely because they serve nothing, and Symplax assumes an app has a
 * port, health-checks it and probes its public URL every minute. A worker
 * imported as an ordinary app would be reported as permanently down while
 * working perfectly, so the planner marks it portless.
 *
 * Deliberately serves no HTTP. If this ends up with a URL and a health check
 * after an import, that is the bug.
 */
const started = new Date().toISOString();
let ticks = 0;

console.log(`do-fixture-worker started at ${started}, serving nothing by design`);

setInterval(() => {
  ticks += 1;
  console.log(`do-fixture-worker tick ${ticks} (${new Date().toISOString()})`);
}, 30_000);
