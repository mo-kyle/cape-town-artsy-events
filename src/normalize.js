// Normalised event shape, area detection and cross-source de-duplication.
import { AREAS, TIMEZONE } from './config.js';
import { keywordRegex } from './classify.js';
import { slugify, truncate } from './text.js';

const AREA_RE = AREAS.map((a) => ({ id: a.id, re: keywordRegex(a.places) }));

/** Pick an area id from free-text location fields; null when nothing matches. */
export function detectArea(...fields) {
  const text = fields.filter(Boolean).join(' | ').toLowerCase();
  if (!text) return null;
  for (const a of AREA_RE) {
    a.re.lastIndex = 0;
    if (a.re.test(text)) return a.id;
  }
  return null;
}

/** Unix seconds or ms, Date, or ISO string -> ISO string (or null). */
export function toIso(v) {
  if (v == null || v === '') return null;
  let d;
  if (v instanceof Date) d = v;
  else if (typeof v === 'number') d = new Date(v < 1e12 ? v * 1000 : v);
  else d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Build the canonical event record from a source's partial.
 * @param {object} p
 * @param {{areaHint?:string|null}} [opts]
 */
export function makeEvent(p, opts = {}) {
  const start = toIso(p.start);
  const end = toIso(p.end);
  const title = String(p.title || '').replace(/\s+/g, ' ').trim();
  const area = detectArea(p.city, p.address, p.venue, p.title) || opts.areaHint || null;
  return {
    id: `${p.source}:${p.sourceId}`,
    source: p.source,
    sourceName: p.sourceName,
    sourceId: String(p.sourceId),
    title,
    description: truncate((p.description || '').replace(/\n{3,}/g, '\n\n').trim(), 700),
    url: p.url,
    image: p.image || null,
    start,
    end,
    allDay: Boolean(p.allDay),
    dates: Array.isArray(p.dates) ? p.dates.map(toIso).filter(Boolean) : undefined,
    timezone: TIMEZONE,
    venue: p.venue || null,
    address: p.address || null,
    city: p.city || null,
    area,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    price: p.price || null,
    organiser: p.organiser || null,
    sourceCategories: p.sourceCategories || [],
    categories: p.categories || [],
    score: p.score ?? 0,
    alsoOn: [],
  };
}

const NOISE_WORDS = /\b(the|a|an|and|&|with|at|in|for|of|to|workshop|class|classes|session|experience|cape town|ct|2026|2027|november|december|january|february|march|april|may|june|july|august|september|october|nov|dec|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct)\b/g;

export function dedupeKey(ev) {
  const t = slugify(ev.title.toLowerCase().replace(/[|–—:(].*$/, '').replace(NOISE_WORDS, ' ')).slice(0, 60);
  const day = ev.start ? ev.start.slice(0, 10) : 'nodate';
  return `${t}|${day}`;
}

/** Merge duplicates across sources; earlier events in the array win. */
export function dedupe(events) {
  const byKey = new Map();
  for (const ev of events) {
    const key = dedupeKey(ev);
    const existing = byKey.get(key);
    if (!existing) { byKey.set(key, ev); continue; }
    if (!existing.alsoOn.some((a) => a.url === ev.url) && ev.url !== existing.url) {
      existing.alsoOn.push({ source: ev.source, sourceName: ev.sourceName, url: ev.url });
    }
    for (const f of ['image', 'venue', 'address', 'city', 'lat', 'lng', 'price', 'organiser', 'end']) {
      if (existing[f] == null && ev[f] != null) existing[f] = ev[f];
    }
    if ((ev.description || '').length > (existing.description || '').length) existing.description = ev.description;
    if (!existing.area && ev.area) existing.area = ev.area;
    for (const c of ev.categories) if (!existing.categories.includes(c)) existing.categories.push(c);
    existing.score = Math.max(existing.score, ev.score);
  }
  return [...byKey.values()];
}
