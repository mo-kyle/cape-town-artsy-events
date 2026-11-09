// Orchestrator: run every source, classify, normalise, de-duplicate and write
// docs/data/events.json for the static site. Usage:
//   node src/fetch.js                 # all sources
//   node src/fetch.js --source quicket
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { classify } from './classify.js';
import { makeEvent, dedupe } from './normalize.js';
import { CATEGORIES, AREAS } from './config.js';
import { source as quicket } from './sources/quicket.js';
import { source as webtickets } from './sources/webtickets.js';
import { source as eventbrite } from './sources/eventbrite.js';
import { source as meetup } from './sources/meetup.js';

// Order matters: when two sources list the same event, the earlier one wins.
const SOURCES = [quicket, webtickets, eventbrite, meetup];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'data', 'events.json');
const DEBUG_OUT = path.join(ROOT, '.cache', 'rejected.json');

const log = (msg) => console.error(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--source') ? args[args.indexOf('--source') + 1] : null;
  const sources = only ? SOURCES.filter((s) => s.id === only) : SOURCES;
  if (!sources.length) throw new Error(`unknown source "${only}"; known: ${SOURCES.map((s) => s.id).join(', ')}`);

  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 3600 * 1000);
  const kept = [];
  const rejected = [];
  const stats = [];

  const results = await Promise.all(
    sources.map(async (src) => {
      const t0 = Date.now();
      try {
        const raws = await src.fetch({ now, log });
        return { src, raws, ms: Date.now() - t0 };
      } catch (e) {
        log(`${src.id}: FAILED ${e.message}`);
        return { src, raws: [], ms: Date.now() - t0, error: e.message };
      }
    })
  );

  for (const { src, raws, ms, error } of results) {
    let keptHere = 0;
    for (const raw of raws) {
      const c = classify(raw);
      const ev = makeEvent({ ...raw, categories: c.categories, score: c.score }, { areaHint: src.areaHint ?? null });
      if (!ev.start || !ev.title || !ev.url) continue;
      const endOrStart = ev.end ? new Date(ev.end) : new Date(ev.start);
      if (endOrStart < cutoff) continue;
      if (!c.include) { rejected.push({ title: ev.title, source: ev.source, score: c.score, reasons: c.reasons, url: ev.url }); continue; }
      kept.push(ev);
      keptHere++;
    }
    stats.push({ id: src.id, name: src.name, url: src.url, fetched: raws.length, kept: keptHere, ms, error: error || null });
    log(`${src.id}: fetched ${raws.length}, kept ${keptHere} (${ms} ms)`);
  }

  const events = dedupe(kept).sort((a, b) => a.start.localeCompare(b.start));

  // Remember when each event was first seen so the site can sort by "recently added".
  let previous = {};
  try {
    const prev = JSON.parse(await readFile(OUT, 'utf8'));
    for (const e of prev.events || []) if (e.firstSeen) previous[e.id] = e.firstSeen;
  } catch { /* first run */ }
  for (const e of events) e.firstSeen = previous[e.id] || now.toISOString();
  const payload = {
    generatedAt: now.toISOString(),
    region: 'Western Cape, South Africa',
    sources: stats,
    categories: CATEGORIES.map(({ id, label, emoji }) => ({ id, label, emoji })),
    areas: AREAS.map(({ id, label }) => ({ id, label })),
    count: events.length,
    events,
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 1));
  await mkdir(path.dirname(DEBUG_OUT), { recursive: true });
  await writeFile(DEBUG_OUT, JSON.stringify(rejected.sort((a, b) => b.score - a.score), null, 1));
  log(`wrote ${events.length} events to ${path.relative(ROOT, OUT)} (${rejected.length} rejected, see .cache/rejected.json)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
