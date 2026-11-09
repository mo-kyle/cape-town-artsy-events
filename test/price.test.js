import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceFromOffers } from '../src/sources/quicket.js';
import { meetupPrice } from '../src/sources/meetup.js';
import { parseDateText } from '../src/sources/webtickets.js';

test('quicket: free only when every ticket is R0', () => {
  assert.equal(priceFromOffers([{ price: 0 }, { price: 0 }]).free, true);
  const mixed = priceFromOffers([{ price: 0 }, { price: 105 }]);
  assert.equal(mixed.free, false);
  assert.equal(mixed.hasFreeOption, true);
  assert.equal(mixed.text, 'Free – R105');
  assert.equal(priceFromOffers([{ price: 150 }, { price: 360 }]).text, 'R150 – R360');
  assert.equal(priceFromOffers([]), null);
});

test('meetup: free only when the event says so', () => {
  assert.equal(meetupPrice(null, 'Free Friday Lunchtime Guided Meditation').free, true);
  assert.equal(meetupPrice(null, 'Free Dive Forage Adventure'), null);
  assert.equal(meetupPrice(null, 'Ceramic Painting at Ceramic Cafe', 'Pay for your piece at the cafe'), null);
  assert.equal(meetupPrice({ amount: 12, currency: 'USD', accepts: 'CASH' }, 'X').text, '$12 (cash on the day)');
});

test('webtickets: date ranges parse with the later year', () => {
  assert.equal(parseDateText('18 Oct - 13 Nov 2026').start, '2026-10-18T00:00:00+02:00');
});
