// Artsy Cape Town — client. Loads data/events.json and renders a filterable,
// date-grouped list with a details panel. Filters live in the URL hash so
// views are shareable.
const TZ = 'Africa/Johannesburg';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = { q: '', from: '', to: '', area: 'all', price: 'all', sort: 'date', cats: new Set() };
let DATA = null;
let catById = {};
let areaById = {};

const fmt = {
  day: new Intl.DateTimeFormat('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ }),
  dayLong: new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }),
  dayFull: new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }),
  time: new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }),
  updated: new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }),
  dd: new Intl.DateTimeFormat('en-ZA', { day: 'numeric', timeZone: TZ }),
  mm: new Intl.DateTimeFormat('en-ZA', { month: 'short', timeZone: TZ }),
  wd: new Intl.DateTimeFormat('en-ZA', { weekday: 'short', timeZone: TZ }),
  key: new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ }),
};

const dayKey = (d) => fmt.key.format(d);
const addDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };
const saWeekday = (d) => new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ }).format(d);
const dayStart = (key) => new Date(key + 'T00:00:00+02:00');

/* ---------- URL state ---------- */
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.has('places')) setTimeout(() => $('#places')?.scrollIntoView({ block: 'start' }), 50);
  state.q = h.get('q') || '';
  state.from = h.get('from') || '';
  state.to = h.get('to') || '';
  state.area = h.get('area') || 'all';
  state.price = h.get('price') || 'all';
  state.sort = h.get('sort') || 'date';
  state.cats = new Set((h.get('cats') || '').split(',').filter(Boolean));
}
function writeHash() {
  const h = new URLSearchParams();
  if (state.q) h.set('q', state.q);
  if (state.from) h.set('from', state.from);
  if (state.to) h.set('to', state.to);
  if (state.area !== 'all') h.set('area', state.area);
  if (state.price !== 'all') h.set('price', state.price);
  if (state.sort !== 'date') h.set('sort', state.sort);
  if (state.cats.size) h.set('cats', [...state.cats].join(','));
  const s = h.toString();
  history.replaceState(null, '', s ? '#' + s : location.pathname);
}
function syncControls() {
  $('#q').value = state.q; $('#from').value = state.from; $('#to').value = state.to;
  $('#area').value = state.area; $('#price').value = state.price; $('#sort').value = state.sort;
  const preset = detectPreset();
  for (const b of $$('.preset')) b.setAttribute('aria-pressed', String(b.dataset.preset === preset));
}

/* ---------- date helpers ---------- */
function presetRange(name, now = new Date()) {
  const today = dayKey(now);
  if (name === 'today') return [today, today];
  if (name === 'week') return [today, dayKey(addDays(now, 7))];
  if (name === 'month') return [today, dayKey(addDays(now, 30))];
  if (name === 'weekend') {
    const off = { Mon: 4, Tue: 3, Wed: 2, Thu: 1, Fri: 0, Sat: -1, Sun: -2 }[saWeekday(now)];
    return [dayKey(addDays(now, Math.max(off, 0))), dayKey(addDays(now, off + 2))];
  }
  return ['', ''];
}
function detectPreset() {
  for (const p of ['today', 'weekend', 'week', 'month']) {
    const [f, t] = presetRange(p);
    if (f === state.from && t === state.to) return p;
  }
  return !state.from && !state.to ? 'all' : null;
}

/** Every upcoming occurrence of an event (ISO strings), or a single "running" marker. */
function occurrences(ev, now) {
  const list = (ev.dates && ev.dates.length ? ev.dates : [ev.start]).map((d) => new Date(d)).filter((d) => d >= now);
  if (list.length) return list;
  if (ev.end && new Date(ev.end) >= now) return [now]; // already started, still running
  return [new Date(ev.start)];
}

/** The first occurrence inside the active date window (or next one when no window). */
function pickOccurrence(ev, now) {
  const occ = occurrences(ev, now);
  if (!state.from && !state.to) return occ[0];
  const hit = occ.find((d) => { const k = dayKey(d); return (!state.from || k >= state.from) && (!state.to || k <= state.to); });
  return hit || null;
}

/* ---------- filtering ---------- */
function priceMatches(ev) {
  if (state.price === 'all') return true;
  const p = ev.price;
  if (state.price === 'free') return Boolean(p && p.free);
  if (!p || p.amount == null) return false;
  const a = p.amount;
  if (state.price === 'lt200') return a < 200;
  if (state.price === '200-500') return a >= 200 && a <= 500;
  if (state.price === '500-1000') return a > 500 && a <= 1000;
  if (state.price === 'gt1000') return a > 1000;
  return true;
}
function textMatches(ev) {
  if (!state.q) return true;
  const hay = [ev.title, ev.venue, ev.address, ev.organiser, ev.description, ...(ev.sourceCategories || [])].join(' ').toLowerCase();
  return state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}
function baseMatches(ev, { ignoreCats = false, ignoreDates = false } = {}) {
  if (!ignoreCats && state.cats.size && !ev.categories.some((c) => state.cats.has(c))) return false;
  if (state.area !== 'all' && ev.area !== state.area) return false;
  if (!priceMatches(ev)) return false;
  if (!textMatches(ev)) return false;
  return true;
}

function sortShown(items) {
  const amt = (ev) => (ev.price && ev.price.amount != null ? ev.price.amount : null);
  if (state.sort === 'price-asc') items.sort((a, b) => (amt(a.ev) ?? 1e12) - (amt(b.ev) ?? 1e12) || a.at - b.at);
  else if (state.sort === 'price-desc') items.sort((a, b) => (amt(b.ev) ?? -1) - (amt(a.ev) ?? -1) || a.at - b.at);
  else if (state.sort === 'new') items.sort((a, b) => (b.ev.firstSeen || '').localeCompare(a.ev.firstSeen || '') || a.at - b.at);
  else items.sort((a, b) => a.at - b.at);
}

/* ---------- rendering ---------- */
function priceLabel(p) {
  if (!p) return 'Price on site';
  if (p.free) return 'Free';
  return p.text || (p.amount != null ? `R${p.amount}` : 'Price on site');
}
function whereLabel(ev) {
  const bits = [];
  if (ev.venue) bits.push(ev.venue);
  if (ev.city && !(ev.venue || '').toLowerCase().includes(ev.city.toLowerCase())) bits.push(ev.city);
  if (!bits.length && ev.address) bits.push(ev.address);
  if (!bits.length) bits.push(areaById[ev.area]?.label || 'Western Cape');
  return bits.join(', ');
}
function relDay(key, now) {
  const today = dayKey(now);
  if (key === today) return 'Today';
  if (key === dayKey(addDays(now, 1))) return 'Tomorrow';
  const diff = Math.round((dayStart(key) - dayStart(today)) / 86400000);
  if (diff > 1 && diff < 7) return 'This week';
  if (diff >= 7 && diff < 14) return 'Next week';
  return '';
}
function setImage(imgEl, emojiEl, ev) {
  emojiEl.textContent = catById[ev.categories[0]]?.emoji || '🎨';
  imgEl.hidden = !ev.image;
  if (ev.image) { imgEl.src = ev.image; imgEl.onerror = () => { imgEl.hidden = true; }; }
}
function fillTags(el, ev) {
  el.replaceChildren();
  for (const c of ev.categories.slice(0, 3)) {
    const t = document.createElement('span'); t.className = 'tag';
    t.textContent = `${catById[c]?.emoji || ''} ${catById[c]?.label || c}`.trim();
    el.appendChild(t);
  }
}

function renderDayStrip(now) {
  const strip = $('#daystrip');
  const counts = {};
  for (const ev of DATA.events) {
    if (!baseMatches(ev)) continue;
    for (const d of occurrences(ev, now)) { const k = dayKey(d); counts[k] = (counts[k] || 0) + 1; }
  }
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 28; i++) {
    const d = addDays(now, i);
    const k = dayKey(d);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'daybtn';
    b.dataset.key = k;
    b.setAttribute('aria-pressed', String(state.from === k && state.to === k));
    if (!counts[k]) b.classList.add('none');
    const wd = saWeekday(d);
    if (wd === 'Sat' || wd === 'Sun') b.classList.add('wknd');
    b.innerHTML = `<span class="wd">${fmt.wd.format(d)}</span><b>${fmt.dd.format(d)}</b><span class="n">${counts[k] || ''}</span>`;
    b.title = `${fmt.dayFull.format(d)} · ${counts[k] || 0} events`;
    b.addEventListener('click', () => {
      if (state.from === k && state.to === k) { state.from = ''; state.to = ''; }
      else { state.from = k; state.to = k; }
      update();
    });
    frag.appendChild(b);
  }
  strip.replaceChildren(frag);
}

function render() {
  if (!DATA) return;
  const now = new Date();
  const list = $('#list');
  const tpl = $('#card-tpl');

  const shown = [];
  for (const ev of DATA.events) {
    if (!baseMatches(ev)) continue;
    const at = pickOccurrence(ev, now);
    if (at) shown.push({ ev, at });
  }
  sortShown(shown);

  // Chip counts honour every filter except the category chips themselves.
  const counts = {};
  for (const ev of DATA.events) {
    if (!baseMatches(ev, { ignoreCats: true }) || !pickOccurrence(ev, now)) continue;
    for (const c of ev.categories) counts[c] = (counts[c] || 0) + 1;
  }
  for (const btn of $$('.chip[data-cat]')) {
    btn.querySelector('.n').textContent = counts[btn.dataset.cat] || 0;
    btn.setAttribute('aria-pressed', String(state.cats.has(btn.dataset.cat)));
    btn.classList.toggle('none', !counts[btn.dataset.cat]);
  }
  $('.chip.clear').hidden = !state.cats.size;
  renderDayStrip(now);

  const catText = state.cats.size ? ' in ' + [...state.cats].map((c) => catById[c]?.label || c).join(', ') : '';
  let rangeText = '';
  if (state.from && state.to && state.from === state.to) rangeText = ` on ${fmt.dayLong.format(dayStart(state.from))}`;
  else if (state.from || state.to) rangeText = ` ${state.from ? 'from ' + fmt.day.format(dayStart(state.from)) : ''}${state.to ? ' to ' + fmt.day.format(dayStart(state.to)) : ''}`;
  $('#summary').textContent = `${shown.length} ${shown.length === 1 ? 'event' : 'events'}${catText}${rangeText}`;
  $('#empty').hidden = shown.length > 0;

  const frag = document.createDocumentFragment();
  const grouped = state.sort === 'date';
  let currentKey = null, grid = null;
  if (!grouped) { grid = document.createElement('div'); grid.className = 'grid'; frag.appendChild(grid); }

  for (const { ev, at } of shown) {
    if (grouped) {
      const key = dayKey(at);
      if (key !== currentKey) {
        currentKey = key;
        const day = document.createElement('div'); day.className = 'day';
        const h = document.createElement('h2'); h.textContent = fmt.dayLong.format(at); day.appendChild(h);
        const rel = relDay(key, now);
        if (rel) { const s = document.createElement('span'); s.className = 'rel'; s.textContent = rel; day.appendChild(s); }
        frag.appendChild(day);
        grid = document.createElement('div'); grid.className = 'grid'; frag.appendChild(grid);
      }
    }
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = ev.id;
    setImage($('img', node), $('.thumb-emoji', node), ev);
    $('.datebadge .dd', node).textContent = fmt.dd.format(at);
    $('.datebadge .mm', node).textContent = fmt.mm.format(at);
    fillTags($('.tags', node), ev);
    $('.title', node).textContent = ev.title;

    const running = at.getTime() === now.getTime();
    const when = $('.when', node);
    when.textContent = running
      ? `Running until ${fmt.day.format(new Date(ev.end))}`
      : `${fmt.day.format(at)}${ev.allDay ? '' : ' · ' + fmt.time.format(at)}`;
    const more = occurrences(ev, now).filter((d) => d > at).length;
    if (more) { const m = document.createElement('span'); m.className = 'more'; m.textContent = ` · +${more} more date${more > 1 ? 's' : ''}`; when.appendChild(m); }

    $('.where', node).textContent = whereLabel(ev);
    $('.desc', node).textContent = ev.description || '';
    const price = $('.price', node);
    price.textContent = priceLabel(ev.price);
    price.classList.toggle('free', Boolean(ev.price?.free));
    price.classList.toggle('unknown', !ev.price);
    const src = $('.source', node);
    src.textContent = `via ${ev.sourceName}${ev.alsoOn?.length ? ` +${ev.alsoOn.length}` : ''}`;

    const open = () => openDetail(ev, at, now);
    node.addEventListener('click', open);
    node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    grid.appendChild(node);
  }
  list.replaceChildren(frag);
}

/* ---------- detail dialog ---------- */
function openDetail(ev, at, now) {
  const dlg = $('#detail');
  setImage($('.d-thumb img', dlg), $('.d-thumb .thumb-emoji', dlg), ev);
  fillTags($('.tags', dlg), ev);
  $('.d-title', dlg).textContent = ev.title;

  const running = at.getTime() === now.getTime();
  let when = running ? `Already running · until ${fmt.dayFull.format(new Date(ev.end))}` : fmt.dayFull.format(at) + (ev.allDay ? '' : ` · ${fmt.time.format(at)}`);
  if (!running && ev.end && !ev.dates) {
    const end = new Date(ev.end);
    if (dayKey(end) === dayKey(at) && !ev.allDay) when += `–${fmt.time.format(end)}`;
    else if (dayKey(end) !== dayKey(at)) when += ` → ${fmt.day.format(end)}`;
  }
  $('.d-when', dlg).textContent = when;
  $('.d-where', dlg).textContent = [ev.venue, ev.address].filter(Boolean).join(' · ') || whereLabel(ev);
  let price = priceLabel(ev.price);
  if (ev.price?.hasFreeOption) price += ' (a free ticket type exists; check which one it is)';
  if (!ev.price) price = 'Not published in the listing — see the ticket page';
  $('.d-price', dlg).textContent = price;
  $('.d-org-row', dlg).hidden = !ev.organiser;
  $('.d-org', dlg).textContent = ev.organiser || '';

  const datesBox = $('.d-dates', dlg);
  const occ = occurrences(ev, now).filter((d) => d.getTime() !== now.getTime());
  datesBox.hidden = occ.length < 2;
  if (occ.length >= 2) {
    const ul = $('ul', datesBox); ul.replaceChildren();
    for (const d of occ.slice(0, 40)) {
      const li = document.createElement('li');
      li.textContent = `${fmt.dayFull.format(d)}${ev.allDay ? '' : ' · ' + fmt.time.format(d)}`;
      if (d.getTime() === at.getTime()) li.className = 'current';
      ul.appendChild(li);
    }
    if (occ.length > 40) { const li = document.createElement('li'); li.textContent = `…and ${occ.length - 40} more`; ul.appendChild(li); }
  }

  $('.d-desc', dlg).textContent = ev.description || 'No description in the listing.';
  const tickets = $('.d-tickets', dlg);
  tickets.href = ev.url; tickets.textContent = `Get tickets on ${ev.sourceName}`;
  const map = $('.d-map', dlg);
  const q = ev.lat != null && ev.lng != null ? `${ev.lat},${ev.lng}` : [ev.venue, ev.address || ev.city].filter(Boolean).join(', ');
  map.hidden = !q;
  map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const also = $('.d-also', dlg); also.replaceChildren();
  if (ev.alsoOn?.length) {
    also.append('Also on ');
    ev.alsoOn.forEach((a, i) => { const l = document.createElement('a'); l.href = a.url; l.target = '_blank'; l.rel = 'noopener'; l.textContent = a.sourceName; also.appendChild(l); if (i < ev.alsoOn.length - 1) also.append(', '); });
  }
  dlg.showModal();
}

/* ---------- controls ---------- */
function buildControls() {
  const chips = $('#chips');
  for (const c of DATA.categories) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.cat = c.id; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `${c.emoji} ${c.label}<span class="n"></span>`;
    b.addEventListener('click', () => { state.cats.has(c.id) ? state.cats.delete(c.id) : state.cats.add(c.id); update(); });
    chips.appendChild(b);
  }
  const clear = document.createElement('button');
  clear.type = 'button'; clear.className = 'chip clear'; clear.textContent = 'Clear'; clear.hidden = true;
  clear.addEventListener('click', () => { state.cats.clear(); update(); });
  chips.appendChild(clear);

  const area = $('#area');
  for (const a of DATA.areas) { const o = document.createElement('option'); o.value = a.id; o.textContent = a.label; area.appendChild(o); }

  let t;
  $('#q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); update(); }, 120); });
  $('#area').addEventListener('change', (e) => { state.area = e.target.value; update(); });
  $('#price').addEventListener('change', (e) => { state.price = e.target.value; update(); });
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; update(); });
  $('#from').addEventListener('change', (e) => { state.from = e.target.value; if (state.to && state.to < state.from) state.to = state.from; update(); });
  $('#to').addEventListener('change', (e) => { state.to = e.target.value; if (state.from && state.from > state.to) state.from = state.to; update(); });
  for (const b of $$('.preset')) b.addEventListener('click', () => { [state.from, state.to] = presetRange(b.dataset.preset); update(); });

  const dlg = $('#detail');
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });

  $('#theme').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme || 'auto';
    const next = cur === 'auto' ? 'dark' : cur === 'dark' ? 'light' : 'auto';
    if (next === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = next;
    try { next === 'auto' ? localStorage.removeItem('theme') : localStorage.setItem('theme', next); } catch { /* private mode */ }
  });

  window.addEventListener('hashchange', () => { readHash(); syncControls(); render(); });

  // The hash carries filter state, so the "museums & galleries" link scrolls instead of navigating.
  $('.tagline a[href="#places"]').addEventListener('click', (e) => { e.preventDefault(); $('#places').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
}

function update() { writeHash(); syncControls(); render(); }

function renderMeta() {
  const upd = new Date(DATA.generatedAt);
  const priced = DATA.events.filter((e) => e.price).length;
  $('#meta').textContent = `${DATA.count} upcoming events · ${priced} with prices · updated ${fmt.updated.format(upd)} SAST`;
  const ul = $('#sources');
  for (const s of DATA.sources) {
    const li = document.createElement('li');
    if (s.error) li.className = 'err';
    const a = document.createElement('a'); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.name;
    li.appendChild(a);
    const n = document.createElement('span'); n.className = 'n';
    n.textContent = s.error ? ' — failed last run' : ` — ${s.kept} of ${s.fetched} listings kept`;
    li.appendChild(n);
    ul.appendChild(li);
  }
}

async function loadPlaces() {
  try {
    const res = await fetch('data/places.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const data = await res.json();
    $('#places-note').textContent = data.note || '';
    const grid = $('#places-grid');
    for (const p of data.places) {
      const a = document.createElement('a');
      a.className = 'place'; a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
      const kind = document.createElement('span'); kind.className = 'kind'; kind.textContent = p.kind;
      const h = document.createElement('h3'); h.textContent = p.name;
      const area = document.createElement('span'); area.className = 'area'; area.textContent = p.area;
      const blurb = document.createElement('p'); blurb.textContent = p.blurb;
      a.append(kind, h, area, blurb);
      grid.appendChild(a);
    }
  } catch { $('#places').hidden = true; }
}

async function main() {
  readHash();
  loadPlaces();
  try {
    const res = await fetch('data/events.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
  } catch (e) {
    $('#meta').textContent = 'Could not load events data.';
    $('#summary').textContent = String(e.message || e);
    return;
  }
  catById = Object.fromEntries(DATA.categories.map((c) => [c.id, c]));
  areaById = Object.fromEntries(DATA.areas.map((a) => [a.id, a]));
  renderMeta();
  buildControls();
  syncControls();
  render();
}
main();
