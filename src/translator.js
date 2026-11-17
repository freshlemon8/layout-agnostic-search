// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Vladislav Tereshchenko
// Pure module. Does not import resource:// or gi://, so it works in both gjs -m and GNOME Shell.

export const MAX_QUERY_LENGTH = 128; // Total query length; beyond this, variants are not built
export const MIN_TERM_LENGTH = 2; // Shorter terms do not generate variants

// Latin (US QWERTY keys, without Shift) to JCUKEN-RU mapping table
const RU_FROM_LATIN = new Map([
    ['q', 'й'], ['w', 'ц'], ['e', 'у'], ['r', 'к'], ['t', 'е'],
    ['y', 'н'], ['u', 'г'], ['i', 'ш'], ['o', 'щ'], ['p', 'з'],
    ['[', 'х'], [']', 'ъ'],
    ['a', 'ф'], ['s', 'ы'], ['d', 'в'], ['f', 'а'], ['g', 'п'],
    ['h', 'р'], ['j', 'о'], ['k', 'л'], ['l', 'д'], [';', 'ж'], ["'", 'э'],
    ['z', 'я'], ['x', 'ч'], ['c', 'с'], ['v', 'м'], ['b', 'и'],
    ['n', 'т'], ['m', 'ь'], [',', 'б'], ['.', 'ю'], ['/', '.'],
    ['`', 'ё'],
]);

// Latin to JCUKEN-UA mapping table: differences from RU
const UA_FROM_LATIN = new Map(RU_FROM_LATIN);
UA_FROM_LATIN.set('s', 'і');
UA_FROM_LATIN.set(']', 'ї');
UA_FROM_LATIN.set("'", 'є');
UA_FROM_LATIN.set('\\', 'ґ');
UA_FROM_LATIN.delete('`'); // Ukrainian layout does not have yo (ё)

function invert(map) {
    const result = new Map();
    for (const [key, value] of map)
        result.set(value, key);
    return result;
}

const RU_TO_LATIN = invert(RU_FROM_LATIN);
const UA_TO_LATIN = invert(UA_FROM_LATIN);

const LAYOUTS = [
    { to: RU_FROM_LATIN, from: RU_TO_LATIN },
    { to: UA_FROM_LATIN, from: UA_TO_LATIN },
];

const CYRILLIC_RE = /\p{Script=Cyrillic}/u;
const LETTER_RE = /\p{L}/u;

/**
 * Character-by-character replacement using a mapping table.
 * If at least one character is not found in the table (digits, spaces, unknown symbols),
 * returns null.
 */
function mapTerm(term, table) {
    let result = '';
    for (const ch of term) {
        const mapped = table.get(ch);
        if (mapped === undefined)
            return null;
        result += mapped;
    }
    return result;
}

/**
 * Returns an alternative for a single term or null.
 * Translates only Cyrillic to Latin (QWERTY). Latin is not translated.
 */
function alternativeFor(term, layout) {
    if (!LETTER_RE.test(term))
        return null;
    if (!CYRILLIC_RE.test(term))
        return null;
    const mapped = mapTerm(term, layout.from);
    return mapped !== null && mapped !== term ? mapped : null;
}

/**
 * Checks whether any term contains Cyrillic characters.
 */
function hasCyrillic(terms) {
    return terms.some(term => CYRILLIC_RE.test(term));
}

/**
 * Builds a list of search queries.
 * The first element is always the original query.
 * Following elements are queries where each term is translated from Cyrillic to QWERTY (RU and UA variants).
 * Duplicates are removed.
 *
 * When the original query contains Cyrillic, it remains in the list
 * so GNOME Shell can simultaneously show applications with Cyrillic names
 * and translation results (e.g. Firefox for "ашку").
 *
 * @param {string[]} terms - terms from Shell search
 * @returns {string[][]} list of queries, each query is an array of terms
 */
export function buildQueries(terms) {
    const original = [...terms];
    const totalLength = original.join(' ').length;

    if (totalLength === 0 || totalLength > MAX_QUERY_LENGTH)
        return [original];

    const candidates = [original];
    for (const layout of LAYOUTS) {
        const query = original.map(term => {
            if (Array.from(term).length < MIN_TERM_LENGTH)
                return term;
            return alternativeFor(term.toLowerCase(), layout) ?? term;
        });
        candidates.push(query);
    }

    const seen = new Set();
    const result = [];
    for (const query of candidates) {
        const key = JSON.stringify(query);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(query);
        }
    }
    return result;
}

export { hasCyrillic };

/**
 * Merges sets of result identifiers in order of appearance, without duplicates.
 * @param {string[][]} resultSets
 * @returns {string[]}
 */
export function mergeResults(resultSets) {
    const seen = new Set();
    const merged = [];
    for (const set of resultSets) {
        for (const id of set ?? []) {
            if (!seen.has(id)) {
                seen.add(id);
                merged.push(id);
            }
        }
    }
    return merged;
}
