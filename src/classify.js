// Decides whether an event is an artsy, hands-on activity and which of our
// categories it belongs to. Pure function of title/description/source tags.
import { CATEGORIES, HANDS_ON, HARD_NEGATIVE, SOFT_NEGATIVE, MIN_SCORE } from './config.js';

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build one alternation regex for a keyword list (word-bounded, plural-tolerant). */
export function keywordRegex(list) {
  const parts = list.map((k) =>
    escapeRe(k.trim().toLowerCase())
      .replace(/\s+/g, '[\\s-]+')
      .replace(/'/g, "['’]")
  );
  return new RegExp(`(?<![a-z0-9])(?:${parts.join('|')})(?:e?s)?(?![a-z0-9])`, 'gi');
}

const CATEGORY_RE = CATEGORIES.map((c) => ({ ...c, re: keywordRegex(c.keywords) }));
const HANDS_ON_RE = keywordRegex(HANDS_ON);
const HARD_RE = keywordRegex(HARD_NEGATIVE);
const SOFT_RE = keywordRegex(SOFT_NEGATIVE);

const POSITIVE_SOURCE_TAGS = /art|craft|hobb|workshop|class|food|drink|wellness|education|family|kids|nature|hand/i;
const NEGATIVE_SOURCE_TAGS = /music|sport|business|professional|faith|spiritual|tech|film|movie|comedy|theatre|politic|network/i;

function uniqueMatches(re, text) {
  re.lastIndex = 0;
  const found = new Set();
  let m;
  while ((m = re.exec(text))) found.add(m[0].toLowerCase().replace(/[\s-]+/g, ' '));
  return [...found];
}

/**
 * @param {{title:string, description?:string, sourceCategories?:string[]}} ev
 * @returns {{include:boolean, score:number, categories:string[], reasons:string[]}}
 */
export function classify(ev) {
  const title = (ev.title || '').toLowerCase();
  const desc = (ev.description || '').toLowerCase().slice(0, 4000);
  const tags = (ev.sourceCategories || []).join(' ');
  const reasons = [];

  const hardTitle = uniqueMatches(HARD_RE, title);
  if (hardTitle.length) {
    return { include: false, score: -99, categories: [], reasons: [`hard-negative:${hardTitle.join(',')}`] };
  }

  let score = 0;
  const cats = [];
  for (const cat of CATEGORY_RE) {
    const th = uniqueMatches(cat.re, title);
    const dh = uniqueMatches(cat.re, desc);
    if (!th.length && !dh.length) continue;
    const weight = th.length * 3 + Math.min(dh.length, 3);
    cats.push({ id: cat.id, weight });
    score += weight;
    if (th.length) reasons.push(`${cat.id}:title:${th.join(',')}`);
    if (dh.length) reasons.push(`${cat.id}:desc:${dh.slice(0, 3).join(',')}`);
  }
  if (!cats.length) return { include: false, score: 0, categories: [], reasons: ['no-category'] };

  const handsTitle = uniqueMatches(HANDS_ON_RE, title);
  const handsDesc = uniqueMatches(HANDS_ON_RE, desc);
  if (handsTitle.length) { score += 2; reasons.push(`hands-on:title:${handsTitle.join(',')}`); }
  else if (handsDesc.length) { score += 1; reasons.push(`hands-on:desc:${handsDesc.slice(0, 3).join(',')}`); }

  const softTitle = uniqueMatches(SOFT_RE, title);
  const softDesc = uniqueMatches(SOFT_RE, desc);
  if (softTitle.length) { const p = Math.min(softTitle.length * 2, 4); score -= p; reasons.push(`soft-negative:title:${softTitle.join(',')}`); }
  if (softDesc.length) { score -= Math.min(softDesc.length * 0.5, 1); }

  const hardDesc = uniqueMatches(HARD_RE, desc);
  if (hardDesc.length) { score -= 2; reasons.push(`hard-negative:desc:${hardDesc.slice(0, 3).join(',')}`); }

  if (POSITIVE_SOURCE_TAGS.test(tags)) score += 1;
  if (NEGATIVE_SOURCE_TAGS.test(tags)) score -= 1;

  cats.sort((a, b) => b.weight - a.weight);
  const categories = cats.slice(0, 3).map((c) => c.id);
  return { include: score >= MIN_SCORE, score: Math.round(score * 10) / 10, categories, reasons };
}
