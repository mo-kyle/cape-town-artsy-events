# Artsy Cape Town

A small static site that pulls creative things to do in and around Cape Town into one filterable list: hands-on classes and workshops (pottery, cooking and baking, aromatherapy and incense, candle making, sip-and-paint, textiles, jewellery, floristry, craft, wellness) plus things to go and see — exhibitions and gallery nights, wine and food tastings, festivals and markets. A hand-curated list of museums and galleries (`docs/data/places.json`) sits under the events.

There is no server. A Node script fetches and classifies events, writes `docs/data/events.json`, and GitHub Pages serves the `docs/` folder. A GitHub Actions workflow re-runs the fetch every morning and commits the new data.

## Sources

| Source | How it is read | Notes |
| --- | --- | --- |
| [Quicket](https://www.quicket.co.za) | Its public Algolia search index (the same one the website's own search box uses) | Richest local source. Filtered to `Region: Western Cape`. |
| [Webtickets](https://www.webtickets.co.za) | Category listing pages for the Western Cape, then each promising event's detail page | Workshops & Classes, Art/Design, Food & Drink, Wellness, Education, Family, Nature, Tourism & Attractions (museum admission), Special Days, Other. |
| [Eventbrite](https://www.eventbrite.com/d/south-africa--cape-town/events/) | The JSON embedded in Cape Town category search pages | Sparse for this niche in Cape Town, rate-limits aggressively, and blocks GitHub's runners (HTTP 405), so it contributes little in the scheduled run. Kept for local runs. |
| [Meetup](https://www.meetup.com/find/?location=za--Cape%20Town) | The Next.js data embedded in the "find events" page | Keyword searches; in-person events only. |

Looked at and skipped for now: Howler (single-page app with no discoverable public API), Cape Town Magazine and Cape Town ETC (editorial articles rather than structured events), Facebook and Airbnb Experiences (block automated access).

## How events are chosen

`src/config.js` holds the taxonomy. Each category has a keyword list; `src/classify.js` scores every fetched listing:

- a category keyword in the title scores 3, in the description 1 (capped);
- a "hands-on" word (workshop, class, make your own, beginners…) adds 2 in the title or 1 in the description (the go-and-see categories — exhibitions, tastings, festivals — pass on the title match alone);
- soft negatives (exhibition, dinner, market, party…) subtract; hard negatives in the title (conference, worship, kickboxing, makeup, crypto…) exclude outright;
- the source's own category tags nudge the score up or down.

An event is kept when it has at least one category and a score of 3 or more. Everything rejected on the last run is written to `.cache/rejected.json` (git-ignored) with its reasons, which is the quickest way to tune keywords.

Events that appear on more than one site are merged by normalised title and date; the first source in the list wins and the others are kept as "also on" links.

## Running locally

```bash
npm install
npm run fetch          # writes docs/data/events.json (takes 1–3 minutes)
npm run serve          # http://localhost:4173
```

Fetch a single source while debugging:

```bash
npm run fetch:source quicket
```

Run the classifier tests:

```bash
npm test
```

## Adding a source

1. Create `src/sources/<name>.js` exporting `source = { id, name, url, areaHint?, async fetch({ now, log }) }`.
2. Return an array of plain objects with at least `source`, `sourceName`, `sourceId`, `title`, `url` and `start` (ISO string or unix seconds). Optional: `description`, `image`, `end`, `dates` (extra occurrences), `allDay`, `venue`, `address`, `city`, `lat`, `lng`, `organiser`, `price` (`{ text, amount, currency, free }`), `sourceCategories`.
3. Import it in `src/fetch.js` and add it to `SOURCES`. Order matters for de-duplication.

The classifier, area detection and de-duplication are applied automatically.

## Deployment

The site is served by GitHub Pages from the `docs/` folder on `main`. `.github/workflows/refresh.yml` runs daily at 06:00 SAST (and on demand from the Actions tab), fetches all sources, and commits `docs/data/events.json` if anything changed. Pages redeploys on that commit.
