// Webtickets (webtickets.co.za) — classic server-rendered listing pages.
// We crawl the relevant top-level categories for the Western Cape, then open
// the detail page of every card whose title looks creative to get the venue,
// description and categories.
import * as cheerio from 'cheerio';
import { fetchText } from '../http.js';
import { classify } from '../classify.js';
import { stripHtml, decodeEntities } from '../text.js';

const BASE = 'https://www.webtickets.co.za/v2/';
const CATEGORIES = {
  1605050915: 'Workshops & Classes',
  1605049990: 'Art, Design, Literature',
  1605050198: 'Food & Drink',
  1605050220: 'Health, Wellness, Mental Health',
  1605050148: 'Education',
  1605050174: 'Family & Kids',
  1605050611: 'Nature',
  1605050623: 'Other',
};
const MAX_PAGES = 4;
const MAX_DETAILS = 120;
const CONCURRENCY = 4;
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** "From 14 Nov 2026 09:00" | "22 Nov 2026 09:30" | "18 Oct - 13 Nov 2026" -> {start,end} ISO strings (SAST). */
export function parseDateText(text, now = new Date()) {
  const re = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?(?:\s+(\d{4}))?(?:\s+(\d{1,2}):(\d{2}))?/g;
  const parts = [];
  let m;
  while ((m = re.exec(text))) {
    const mon = MONTHS[m[2].toLowerCase()];
    if (mon == null) continue;
    parts.push({ day: +m[1], mon, year: m[3] ? +m[3] : null, hh: m[4] != null ? +m[4] : null, mm: m[5] != null ? +m[5] : null });
  }
  if (!parts.length) return { start: null, end: null };
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].year == null) {
      const later = parts.slice(i + 1).find((p) => p.year != null);
      parts[i].year = later ? later.year : now.getFullYear();
      if (!later && parts[i].mon < now.getMonth() - 1) parts[i].year += 1;
    }
  }
  const iso = (p, defH, defM) => {
    const h = p.hh ?? defH, mi = p.mm ?? defM;
    return `${p.year}-${String(p.mon + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00+02:00`;
  };
  return { start: iso(parts[0], 0, 0), end: parts[1] ? iso(parts[1], 23, 59) : null, allDay: parts[0].hh == null };
}

function parsePrice(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (/free/i.test(t)) return { text: 'Free', amount: 0, currency: 'ZAR', free: true };
  const nums = [...t.matchAll(/R\s?([\d\s,]+(?:\.\d+)?)/g)].map((m) => Number(m[1].replace(/[\s,]/g, '')));
  return { text: t, amount: nums.length ? Math.min(...nums) : null, currency: 'ZAR', free: false };
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }));
  return out;
}

export const source = {
  id: 'webtickets',
  name: 'Webtickets',
  url: 'https://www.webtickets.co.za/v2/category.aspx?itemid=1605050915&city=western-cape&when=anytime',
  async fetch({ now, log }) {
    const cards = new Map();
    for (const [catId, catName] of Object.entries(CATEGORIES)) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `${BASE}category.aspx?itemid=${catId}&city=western-cape&when=anytime&per=48${page > 1 ? `&page=${page}` : ''}`;
        let html;
        try { html = await fetchText(url); } catch (e) { log(`webtickets: ${catName} p${page} failed: ${e.message}`); break; }
        const $ = cheerio.load(html);
        let found = 0;
        $('.product-card-thumb').each((_, el) => {
          const $card = $(el).parent();
          const a = $card.find('.product-card-title a').first();
          const href = a.attr('href') || '';
          const id = href.match(/itemid=(\d+)/)?.[1];
          if (!id) return;
          found++;
          const existing = cards.get(id);
          const card = existing || {
            id,
            title: decodeEntities(a.text().trim()),
            url: new URL(href, BASE).toString(),
            dateText: $card.find('.product-card-meta').first().text().trim(),
            priceText: $card.find('.product-card-price').first().text().trim(),
            image: $(el).find('img').attr('src') || null,
            categories: new Set(),
          };
          card.categories.add(catName);
          cards.set(id, card);
        });
        if (!found) break;
        if (!$(`a[href*="page=${page + 1}"]`).length) break;
      }
    }
    log(`webtickets: ${cards.size} unique Western Cape listings across ${Object.keys(CATEGORIES).length} categories`);

    // Only open detail pages for titles that look creative; ranked by score.
    const candidates = [...cards.values()]
      .map((c) => ({ c, cls: classify({ title: c.title, sourceCategories: [...c.categories] }) }))
      .filter((x) => x.cls.categories.length > 0)
      .sort((a, b) => b.cls.score - a.cls.score)
      .slice(0, MAX_DETAILS)
      .map((x) => x.c);
    log(`webtickets: opening ${candidates.length} detail pages`);

    const details = await mapLimit(candidates, CONCURRENCY, async (card) => {
      try {
        const html = await fetchText(card.url);
        const $ = cheerio.load(html);
        const venueText = $('#EventPanel_tbxVenue').text().replace(/\s+/g, ' ').trim();
        const geo = ($('#EventPanel_lnkGeolocation').attr('href') || '').match(/q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        const desc = stripHtml($('#EventPanel_event_description').html() || '');
        const cats = $('.event-category').map((_, el) => $(el).text().trim()).get();
        const subtitle = $('#EventPanel_lblSubTitle').text().trim();
        const headerPrice = $('#EventPanel_headerPrice').text().trim();
        const organiser = $('meta[name="client"]').attr('content') || null;
        return { venueText, lat: geo ? Number(geo[1]) : null, lng: geo ? Number(geo[2]) : null, desc, cats, subtitle, headerPrice, organiser };
      } catch (e) {
        log(`webtickets: detail ${card.id} failed: ${e.message}`);
        return null;
      }
    });

    const out = [];
    candidates.forEach((card, i) => {
      const d = details[i] || {};
      const { start, end, allDay } = parseDateText(d.subtitle || card.dateText, now);
      // Venue text is "Name Suburb Western Cape" with no separators; keep it whole as the address.
      const venueText = d.venueText || '';
      out.push({
        source: 'webtickets',
        sourceName: 'Webtickets',
        sourceId: card.id,
        title: card.title,
        description: d.desc || '',
        url: card.url,
        image: card.image ? encodeURI(card.image) : null,
        start,
        end,
        allDay,
        venue: venueText.replace(/\s*Western Cape\s*$/i, '') || null,
        address: venueText || null,
        city: null,
        lat: d.lat ?? null,
        lng: d.lng ?? null,
        organiser: d.organiser,
        price: parsePrice(d.headerPrice || card.priceText),
        sourceCategories: [...new Set([...(d.cats || []), ...card.categories])],
      });
    });
    return out;
  },
  areaHint: 'western-cape',
};
