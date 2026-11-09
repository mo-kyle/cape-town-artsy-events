import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../src/classify.js';
import { detectArea, dedupe, makeEvent } from '../src/normalize.js';

const yes = (title, description = '', tags = []) => assert.ok(classify({ title, description, sourceCategories: tags }).include, `expected include: ${title}`);
const no = (title, description = '', tags = []) => assert.ok(!classify({ title, description, sourceCategories: tags }).include, `expected exclude: ${title}`);

test('obvious hands-on craft events are included', () => {
  yes('Beginner Pottery Wheel Workshop');
  yes('Paint Pouring Workshops - 2026');
  yes('Cultured Butter & Cheese making Workshop');
  yes('Turkish Mosaic Lamp Workshop');
  yes('Candle Making Evening in Woodstock');
  yes('Aromatherapy 101: blend your own essential oils');
  yes('Incense Making Workshop');
  yes('Brush & Brew – Sip & Paint Experience at Life Is Good Café');
  yes('Honest Chocolate Workshop - November 2026');
  yes('Saturday session', 'Join us for a relaxed pottery class where you will make two bowls. All materials included.');
});

test('music, sport, business, faith and beauty events are excluded', () => {
  no('Classical Performance by the South African Lipizzaners');
  no('Schubert Classical Music Evening');
  no('WITWC A.I. Talk and Workshop');
  no('Fighting Femicide: Free Self Defense Workshop - Kickboxing with Chantell');
  no('Makeup and Me Masterclass');
  no('Swazi Dlamini at Hughs Jazz Club', 'live music');
  no('Meridian: Year-end Function at Pinelands Bowling Club', 'Summer spit braai, salad, dessert');
  no('Introduction to marketing & social media workshop');
  no('Shibari Rope Class to Jam | Squish Jam | Beginner friendly');
});

test('exhibitions, tastings, festivals and markets are included', () => {
  yes('Summer Group Exhibition Opening Night');
  yes('Wine Tasting at Groot Constantia');
  yes('Gin & Chocolate Pairing Evening');
  yes('Kirstenbosch Craft Market');
  yes('Cape Town Street Food Festival 2026');
  yes('Artist Walkabout with the curator');
  const c = classify({ title: 'Whisky Tasting Masterclass' });
  assert.ok(c.categories.includes('tastings'));
  const f = classify({ title: 'Darling Wildflower Festival' });
  assert.ok(f.categories.includes('festivals'));
});

test('categories are assigned', () => {
  const c = classify({ title: 'Wheel-thrown pottery class for beginners' });
  assert.deepEqual(c.categories, ['pottery']);
  const d = classify({ title: 'Soy candle making & aromatherapy workshop' });
  assert.ok(d.categories.includes('candles-soap') && d.categories.includes('scent'));
});

test('area detection', () => {
  assert.equal(detectArea('Cape Town', '12 Albert Rd, Woodstock'), 'cape-town');
  assert.equal(detectArea('Stellenbosch', null), 'winelands');
  assert.equal(detectArea(null, 'Main Road, Hermanus, Western Cape'), 'western-cape');
  assert.equal(detectArea('Johannesburg', null), null);
});

test('dedupe merges the same event from two sources', () => {
  const a = makeEvent({ source: 'quicket', sourceName: 'Quicket', sourceId: '1', title: 'Pottery Workshop – Nov 2026', url: 'https://a/1', start: '2026-11-20T10:00:00+02:00', categories: ['pottery'] });
  const b = makeEvent({ source: 'eventbrite', sourceName: 'Eventbrite', sourceId: '2', title: 'Pottery Workshop', url: 'https://b/2', start: '2026-11-20T10:00:00+02:00', image: 'img', categories: ['pottery'] });
  const out = dedupe([a, b]);
  assert.equal(out.length, 1);
  assert.equal(out[0].source, 'quicket');
  assert.equal(out[0].image, 'img');
  assert.equal(out[0].alsoOn[0].source, 'eventbrite');
});
