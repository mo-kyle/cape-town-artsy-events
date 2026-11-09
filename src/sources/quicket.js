// Quicket (quicket.co.za) — South Africa's main independent ticketing site.
// Its web app searches a public Algolia index with a search-only key, so we
// query that index directly instead of scraping HTML.
import { fetchJson, fetchText } from '../http.js';
import { stripHtml } from '../text.js';
import { classify } from '../classify.js';

const APP_ID = 'QAUIPDMSEL';
const SEARCH_KEY = 'ec5eb43c5ca4fd2aa3883ae2c131f731'; // public, search-only key shipped in Quicket's frontend bundle
const INDEX = 'products';
const BASE = 'https://www.quicket.co.za';
const MAX_DETAILS = 200;
const CONCURRENCY = 4;

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }));
  return out;
}

/** Event pages carry schema.org JSON-LD with offers (prices) and the full description. */
function parseEventLd(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const ev = (Array.isArray(j) ? j : [j]).find((x) => x['@type'] === 'Event');
      if (ev) return ev;
    } catch { /* ignore malformed blocks */ }
  }
  return null;
}

function priceFromOffers(offers) {
  const list = (Array.isArray(offers) ? offers : offers ? [offers] : []).map((o) => Number(o.price)).filter((n) => Number.isFinite(n));
  if (!list.length) return null;
  const min = Math.min(...list), max = Math.max(...list);
  if (max === 0) return { text: 'Free', amount: 0, currency: 'ZAR', free: true };
  const fmt = (n) => 'R' + (Number.isInteger(n) ? n : n.toFixed(2));
  return { text: min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`, amount: min, currency: 'ZAR', free: min === 0 };
}

export const source = {
  id: 'quicket',
  name: 'Quicket',
  url: BASE,
  async fetch({ now, log }) {
    const nowSec = Math.floor(now.getTime() / 1000);
    const day = 86400;
    // Algolia caps a single query at 1000 hits, so we page through time windows.
    const windows = [];
    for (let d = 0; d < 365; d += 30) windows.push([nowSec + d * day, nowSec + (d + 30) * day]);
    windows.push([nowSec + 365 * day, nowSec + 10 * 365 * day]);

    const seen = new Map();
    for (const [from, to] of windows) {
      const body = {
        query: '',
        hitsPerPage: 1000,
        filters: "Region:'Western Cape'",
        numericFilters: [`DateFrom>=${from}`, `DateFrom<${to}`],
        attributesToHighlight: [],
      };
      const json = await fetchJson(`https://${APP_ID}-dsn.algolia.net/1/indexes/${INDEX}/query`, {
        method: 'POST',
        headers: {
          'X-Algolia-Application-Id': APP_ID,
          'X-Algolia-API-Key': SEARCH_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (json.nbHits > json.hits.length) log(`quicket: window ${from}-${to} truncated (${json.nbHits} hits)`);
      for (const h of json.hits) seen.set(h.objectID, h);
    }
    // Events already running (started before now, ending later) live in the past windows; grab those too.
    const running = await fetchJson(`https://${APP_ID}-dsn.algolia.net/1/indexes/${INDEX}/query`, {
      method: 'POST',
      headers: { 'X-Algolia-Application-Id': APP_ID, 'X-Algolia-API-Key': SEARCH_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ query: '', hitsPerPage: 1000, filters: "Region:'Western Cape'", numericFilters: [`DateFrom<${nowSec}`, `DateTo>=${nowSec}`], attributesToHighlight: [] }),
    });
    for (const h of running.hits) seen.set(h.objectID, h);
    log(`quicket: ${seen.size} upcoming Western Cape listings`);

    const out = [];
    for (const h of seen.values()) {
      if (/online/i.test(h.Type || '')) continue;
      const dates = (h.Dates || []).filter((d) => d >= nowSec).sort((a, b) => a - b);
      const start = dates[0] ?? h.DateFrom;
      out.push({
        source: 'quicket',
        sourceName: 'Quicket',
        sourceId: h.objectID,
        title: h.ProductName,
        description: stripHtml(h.ProductDescription || ''),
        url: BASE + h.ProductUrl,
        image: h.ImageUrl_Medium ? 'https:' + h.ImageUrl_Medium : null,
        start,
        end: dates.length > 1 ? null : h.DateTo,
        dates: dates.length > 1 ? dates : undefined,
        venue: h.VenueName || null,
        address: h.AddressFormatted || null,
        city: h.City || null,
        lat: h._geoloc?.lat ?? null,
        lng: h._geoloc?.lng ?? null,
        organiser: (h.Organiser || '').trim() || null,
        sourceCategories: (h.Categories || []).filter(Boolean),
      });
    }

    // Enrich likely matches with price and full description from the event page.
    const candidates = out
      .map((ev) => ({ ev, cls: classify(ev) }))
      .filter((x) => x.cls.categories.length > 0)
      .sort((a, b) => b.cls.score - a.cls.score)
      .slice(0, MAX_DETAILS)
      .map((x) => x.ev);
    log(`quicket: enriching ${candidates.length} likely matches from event pages`);
    await mapLimit(candidates, CONCURRENCY, async (ev) => {
      try {
        const ld = parseEventLd(await fetchText(ev.url));
        if (!ld) return;
        ev.price = priceFromOffers(ld.offers);
        const desc = stripHtml(ld.description || '');
        if (desc.length > (ev.description || '').length) ev.description = desc;
        if (!ev.image && typeof ld.image === 'string') ev.image = ld.image;
      } catch (e) {
        log(`quicket: detail ${ev.sourceId} failed: ${e.message}`);
      }
    });
    return out;
  },
};
