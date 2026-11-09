// Meetup — the "find events" page is server-rendered with Next.js and ships
// its Apollo cache (events, venues, groups, photos) in __NEXT_DATA__.
import { fetchText } from '../http.js';

const KEYWORDS = [
  'pottery', 'ceramics', 'cooking', 'baking', 'painting', 'sip and paint', 'art class', 'craft', 'workshop',
  'candle', 'aromatherapy', 'incense', 'weaving', 'knitting', 'crochet', 'calligraphy', 'jewellery', 'floral',
  'sewing', 'creative', 'sound bath',
];

// Meetup only stores a fee when the organiser sets one. With no fee we only call an
// event free when it says so itself; otherwise the price is unknown (null).
export function meetupPrice(fee, title = '', description = '') {
  if (fee && Number(fee.amount) > 0) {
    const cur = fee.currency === 'USD' ? '$' : fee.currency === 'ZAR' ? 'R' : `${fee.currency} `;
    return { text: `${cur}${fee.amount}${fee.accepts === 'CASH' ? ' (cash on the day)' : ''}`, amount: Number(fee.amount), currency: fee.currency, free: false };
  }
  const text = `${title}\n${description.slice(0, 600)}`;
  const saysFree = /(^|[^a-z-])free( event| entry| to attend| to join| of charge| session| class| workshop|!|\.|,|:|$)/im.test(text) || /\bno (charge|cost|fee)\b/i.test(text) || /^free\b/i.test(title);
  const notFree = /free[- ]?dive|freestyle|free[- ]range|free spirit|free parking|free wifi|alcohol[- ]free|gluten[- ]free/i;
  if (saysFree && !notFree.test(title)) return { text: 'Free', amount: 0, currency: 'ZAR', free: true };
  return null;
}

function parseNextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export const source = {
  id: 'meetup',
  name: 'Meetup',
  url: 'https://www.meetup.com/find/?location=za--Cape%20Town&source=EVENTS',
  async fetch({ log }) {
    const seen = new Map();
    for (const kw of KEYWORDS) {
      const url = `https://www.meetup.com/find/?location=za--Cape%20Town&source=EVENTS&eventType=inPerson&keywords=${encodeURIComponent(kw)}`;
      let html;
      try { html = await fetchText(url); } catch (e) { log(`meetup: "${kw}" failed: ${e.message}`); continue; }
      const data = parseNextData(html);
      const ap = data?.props?.pageProps?.__APOLLO_STATE__;
      if (!ap) { log(`meetup: no apollo state for "${kw}"`); continue; }
      for (const [key, val] of Object.entries(ap)) {
        if (!key.startsWith('Event:')) continue;
        const photoRef = val.featuredEventPhoto?.__ref || val.displayPhoto?.__ref;
        const group = val.group?.__ref ? ap[val.group.__ref] : null;
        seen.set(val.id, { ...val, _photo: photoRef ? ap[photoRef] : null, _group: group });
      }
    }
    log(`meetup: ${seen.size} unique events across ${KEYWORDS.length} keyword searches`);

    const out = [];
    for (const e of seen.values()) {
      if (e.eventType && e.eventType !== 'PHYSICAL') continue;
      const v = e.venue || null;
      const fee = e.feeSettings;
      out.push({
        source: 'meetup',
        sourceName: 'Meetup',
        sourceId: e.id,
        title: e.title,
        description: e.description || '',
        url: e.eventUrl,
        image: e._photo?.highResUrl || null,
        start: e.dateTime,
        end: e.endTime || null,
        venue: v?.name || null,
        address: v ? [v.address, v.city].filter(Boolean).join(', ') : null,
        city: v?.city || null,
        organiser: e._group?.name || null,
        price: meetupPrice(fee, e.title, e.description),
        sourceCategories: [],
      });
    }
    return out;
  },
  areaHint: 'cape-town',
};
