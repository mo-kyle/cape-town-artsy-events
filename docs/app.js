// Artsy Cape Town — client. Loads data/events.json and renders a filterable,
// date-grouped list. Filters live in the URL hash so views are shareable.
const TZ = 'Africa/Johannesburg';
const $ = (sel) => document.querySelector(sel);

const state = { q: '', when: 'all', area: 'all', free: false, cats: new Set() };
let DATA = null;

const fmtDay = new Intl.DateTimeFormat('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
const fmtDayLong = new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
const fmtTime = new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
const fmtUpdated = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });

/** YYYY-MM-DD for a Date in South African time. */
function dayKey(d) {
  const p = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ }).format(d);
  return p;
}
function addDays(d, n) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; }
function saWeekday(d) { return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ }).format(d); }

function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  state.q = h.get('q') || '';
  state.when = h.get('when') || 'all';
  state.area = h.get('area') || 'all';
  state.free = h.get('free') === '1';
  state.cats = new Set((h.get('cats') || '').split(',').filter(Boolean));
}
function writeHash() {
  const h = new URLSearchParams();
  if (state.q) h.set('q', state.q);
  if (state.when !== 'all') h.set('when', state.when);
  if (state.area !== 'all') h.set('area', state.area);
  if (state.free) h.set('free', '1');
  if (state.cats.size) h.set('cats', [...state.cats].join(','));
  const s = h.toString();
  history.replaceState(null, '', s ? '#' + s : location.pathname);
}

/** The event's next relevant occurrence on/after now (uses `dates` when present). */
function nextStart(ev, now) {
  if (ev.dates && ev.dates.length) {
    const next = ev.dates.find((d) => new Date(d) >= now);
    if (next) return new Date(next);
  }
  const s = new Date(ev.start);
  if (s >= now) return s;
  // Already started but still running (exhibition-style or multi-day): surface it today.
  if (ev.end && new Date(ev.end) >= now) return now;
  return s;
}

function inWhen(ev, now) {
  if (state.when === 'all') return true;
  const start = nextStart(ev, now);
  const today = dayKey(now);
  if (state.when === 'today') return dayKey(start) === today;
  if (state.when === 'week') return start <= addDays(now, 7);
  if (state.when === 'month') return start <= addDays(now, 30);
  if (state.when === 'weekend') {
    // Upcoming Fri–Sun (if today is Sat/Sun, this weekend).
    const wd = saWeekday(now);
    const offsetToFri = { Mon: 4, Tue: 3, Wed: 2, Thu: 1, Fri: 0, Sat: -1, Sun: -2 }[wd];
    const fri = dayKey(addDays(now, offsetToFri));
    const sun = dayKey(addDays(now, offsetToFri + 2));
    const k = dayKey(start);
    return k >= fri && k <= sun && k >= today;
  }
  return true;
}

function matches(ev, now) {
  if (state.cats.size && !ev.categories.some((c) => state.cats.has(c))) return false;
  if (state.area !== 'all' && ev.area !== state.area) return false;
  if (state.free && !(ev.price && ev.price.free)) return false;
  if (!inWhen(ev, now)) return false;
  if (state.q) {
    const hay = [ev.title, ev.venue, ev.address, ev.organiser, ev.description, ...(ev.sourceCategories || [])].join(' ').toLowerCase();
    if (!state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

function relDay(key, now) {
  const today = dayKey(now);
  if (key === today) return 'Today';
  if (key === dayKey(addDays(now, 1))) return 'Tomorrow';
  const diff = Math.round((new Date(key + 'T00:00:00+02:00') - new Date(today + 'T00:00:00+02:00')) / 86400000);
  if (diff > 1 && diff < 7) return 'This week';
  return '';
}

function priceLabel(p) {
  if (!p) return '';
  if (p.free) return 'Free';
  if (p.text) return p.text.replace(/^R\s?(\d)/, 'R$1');
  if (p.amount != null) return `${p.currency === 'ZAR' ? 'R' : p.currency + ' '}${p.amount}`;
  return '';
}

function render() {
  if (!DATA) return;
  const now = new Date();
  const catById = Object.fromEntries(DATA.categories.map((c) => [c.id, c]));
  const list = $('#list');
  const tpl = $('#card-tpl');
  const shown = DATA.events.filter((ev) => matches(ev, now)).map((ev) => ({ ev, at: nextStart(ev, now) })).sort((a, b) => a.at - b.at);

  // Category counts reflect the other active filters (so chips stay honest).
  const savedCats = state.cats; state.cats = new Set();
  const counts = {};
  for (const ev of DATA.events) if (matches(ev, now)) for (const c of ev.categories) counts[c] = (counts[c] || 0) + 1;
  state.cats = savedCats;
  for (const btn of document.querySelectorAll('.chip[data-cat]')) {
    btn.querySelector('.n').textContent = counts[btn.dataset.cat] || 0;
    btn.setAttribute('aria-pressed', String(state.cats.has(btn.dataset.cat)));
  }
  $('.chip.clear').hidden = !state.cats.size;

  $('#summary').textContent = `${shown.length} ${shown.length === 1 ? 'event' : 'events'}${state.cats.size ? ' in ' + [...state.cats].map((c) => catById[c]?.label || c).join(', ') : ''}`;
  $('#empty').hidden = shown.length > 0;

  const frag = document.createDocumentFragment();
  let currentKey = null, grid = null;
  for (const { ev, at } of shown) {
    const key = dayKey(at);
    if (key !== currentKey) {
      currentKey = key;
      const day = document.createElement('div');
      day.className = 'day';
      const h = document.createElement('h2');
      h.textContent = fmtDayLong.format(at);
      day.appendChild(h);
      const rel = relDay(key, now);
      if (rel) { const s = document.createElement('span'); s.className = 'rel'; s.textContent = rel; day.appendChild(s); }
      frag.appendChild(day);
      grid = document.createElement('div');
      grid.className = 'grid';
      frag.appendChild(grid);
    }
    const node = tpl.content.firstElementChild.cloneNode(true);
    const a = node.querySelector('.card-link');
    a.href = ev.url;
    const img = node.querySelector('img');
    const emoji = node.querySelector('.thumb-emoji');
    emoji.textContent = catById[ev.categories[0]]?.emoji || '🎨';
    if (ev.image) { img.src = ev.image; img.onerror = () => { img.hidden = true; }; } else img.hidden = true;

    const tags = node.querySelector('.tags');
    for (const c of ev.categories.slice(0, 3)) {
      const t = document.createElement('span'); t.className = 'tag';
      t.textContent = `${catById[c]?.emoji || ''} ${catById[c]?.label || c}`.trim();
      tags.appendChild(t);
    }
    node.querySelector('.title').textContent = ev.title;

    const when = node.querySelector('.when');
    const started = new Date(ev.start) < now && at.getTime() === now.getTime();
    let whenText = started ? `Running until ${fmtDay.format(new Date(ev.end))}` : `${fmtDay.format(at)}${ev.allDay ? '' : ' · ' + fmtTime.format(at)}`;
    when.textContent = whenText;
    const future = (ev.dates || []).filter((d) => new Date(d) > at).length;
    if (future) { const m = document.createElement('span'); m.className = 'more'; m.textContent = ` · +${future} more date${future > 1 ? 's' : ''}`; when.appendChild(m); }

    const where = [ev.venue, ev.venue && ev.city && !ev.venue.toLowerCase().includes(ev.city.toLowerCase()) ? ev.city : (!ev.venue ? ev.address : null)].filter(Boolean).join(', ');
    node.querySelector('.where').textContent = where || (DATA.areas.find((x) => x.id === ev.area)?.label || '');
    node.querySelector('.desc').textContent = ev.description || '';

    const price = node.querySelector('.price');
    price.textContent = priceLabel(ev.price);
    if (ev.price?.free) price.classList.add('free');
    const src = node.querySelector('.source');
    src.innerHTML = `via <b></b>`;
    src.querySelector('b').textContent = ev.sourceName + (ev.alsoOn?.length ? ` +${ev.alsoOn.length}` : '');
    grid.appendChild(node);
  }
  list.replaceChildren(frag);
}

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

  $('#q').value = state.q; $('#when').value = state.when; $('#area').value = state.area; $('#free').checked = state.free;
  let t;
  $('#q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); update(); }, 120); });
  $('#when').addEventListener('change', (e) => { state.when = e.target.value; update(); });
  $('#area').addEventListener('change', (e) => { state.area = e.target.value; update(); });
  $('#free').addEventListener('change', (e) => { state.free = e.target.checked; update(); });
  window.addEventListener('hashchange', () => { readHash(); $('#q').value = state.q; $('#when').value = state.when; $('#area').value = state.area; $('#free').checked = state.free; render(); });
}

function update() { writeHash(); render(); }

function renderMeta() {
  const upd = new Date(DATA.generatedAt);
  $('#meta').textContent = `${DATA.count} upcoming events · updated ${fmtUpdated.format(upd)} SAST`;
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

async function main() {
  readHash();
  try {
    const res = await fetch('data/events.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
  } catch (e) {
    $('#meta').textContent = 'Could not load events data.';
    $('#summary').textContent = String(e.message || e);
    return;
  }
  renderMeta();
  buildControls();
  render();
}
main();
