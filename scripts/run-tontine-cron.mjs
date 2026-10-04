const endpoint = process.env.TONTINE_CRON_URL;
const secret = process.env.CRON_SECRET;

if (!endpoint || !secret) {
  throw new Error("TONTINE_CRON_URL et CRON_SECRET sont requis pour lancer le cron des tontines.");
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) {
  throw new Error(`Le cron des tontines a répondu HTTP ${response.status}.`);
}

const result = await response.json();
console.info(`Tontines vérifiées : ${result.processed}. Tirages effectués : ${result.drawn}.`);
