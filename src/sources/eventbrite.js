// Eventbrite — Cape Town search/category pages embed the result set as JSON in
// window.__SERVER_DATA__ (times, venue, tags). Eventbrite rate-limits quickly,
// so we keep the request list short and pause between pages. Relevant Cape
// Town listings here are sparse; this source mainly catches what Quicket and
// Webtickets miss.
import { fetchText } from '../http.js';
import { stripHtml } from '../text.js';

const PATHS = [
  'workshops--events', 'classes', 'arts--events', 'pottery', 'cooking-class', 'painting', 'crafts', 'candle-making',
  'sewing', 'wellness',
];
const MAX_PAGES = 3;
const DELAY_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseServerData(html) {
  const m = html.match(/window\.__SERVER_DATA__\s*=\s*(\{[\s\S]*?\});\s*(?:window\.|<\/script>)/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export const source = {
  id: 'eventbrite',
  name: 'Eventbrite',
  url: 'https://www.eventbrite.com/d/south-africa--cape-town/workshops--events/',
  async fetch({ log }) {
    const seen = new Map();
    let rateLimited = false;
    for (const p of PATHS) {
      if (rateLimited) break;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `https://www.eventbrite.com/d/south-africa--cape-town/${p}/${page > 1 ? `?page=${page}` : ''}`;
        let html;
        try {
          html = await fetchText(url, { retries: 1 });
        } catch (e) {
          log(`eventbrite: ${p} p${page} failed: ${e.message}`);
          if (/429/.test(e.message)) { rateLimited = true; log('eventbrite: rate limited, stopping early'); }
          break;
        } finally {
          await sleep(DELAY_MS);
        }
        const ev = parseServerData(html)?.search_data?.events;
        if (!ev?.results?.length) break;
        for (const r of ev.results) seen.set(r.id, r);
        if (page >= (ev.pagination?.page_count || 1)) break;
      }
    }
    log(`eventbrite: ${seen.size} unique listings`);

    const out = [];
    for (const r of seen.values()) {
      if (r.is_online_event || r.is_cancelled) continue;
      const v = r.primary_venue;
      const a = v?.address || {};
      const offset = '+02:00'; // South Africa has no daylight saving
      out.push({
        source: 'eventbrite',
        sourceName: 'Eventbrite',
        sourceId: r.id,
        title: r.name,
        description: r.summary || stripHtml(r.full_description || ''),
        url: r.url,
        image: r.image?.url || r.image?.original?.url || null,
        start: r.start_date ? `${r.start_date}T${r.start_time || '00:00'}:00${offset}` : null,
        end: r.end_date ? `${r.end_date}T${r.end_time || '23:59'}:00${offset}` : null,
        allDay: !r.start_time,
        venue: v?.name || null,
        address: a.localized_address_display || null,
        city: a.city || null,
        lat: a.latitude ? Number(a.latitude) : null,
        lng: a.longitude ? Number(a.longitude) : null,
        sourceCategories: (r.tags || []).map((t) => t.display_name).filter(Boolean),
      });
    }
    return out;
  },
};
