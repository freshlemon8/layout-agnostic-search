// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Vladislav Tereshchenko
// Чистый модуль. Не импортирует resource:// и gi://, поэтому работает и в gjs -m, и в GNOME Shell.

export const MAX_QUERY_LENGTH = 128;  // суммарная длина запроса, дальше варианты не строятся
export const MIN_TERM_LENGTH = 2;     // короче — варианты не строятся

// Таблица латиница (клавиши US QWERTY, без Shift) → ЙЦУКЕН-RU
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

// Таблица латиница → ЙЦУКЕН-UA: отличия от RU
const UA_FROM_LATIN = new Map(RU_FROM_LATIN);
UA_FROM_LATIN.set('s', 'і');
UA_FROM_LATIN.set(']', 'ї');
UA_FROM_LATIN.set("'", 'є');
UA_FROM_LATIN.set('\\', 'ґ');
UA_FROM_LATIN.delete('`');   // в UA нет ё

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
 * Посимвольная замена по таблице. Если хотя бы один символ не найден
 * в таблице (цифры, пробелы, неизвестные знаки), возвращает null.
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
 * Возвращает альтернативу для одного термина или null.
 * Направление выбирается по алфавиту термина: кириллица → латиница, иначе латиница → кириллица.
 */
function alternativeFor(term, layout) {
    if (!LETTER_RE.test(term))
        return null;
    const table = CYRILLIC_RE.test(term) ? layout.from : layout.to;
    const mapped = mapTerm(term, table);
    return mapped !== null && mapped !== term ? mapped : null;
}

/**
 * Строит список запросов для поиска.
 * Первый элемент — всегда исходный запрос.
 * Далее — запросы, где каждый термин переведён в RU или UA (если перевод возможен).
 * Дубликаты удаляются.
 *
 * @param {string[]} terms — термины из поиска Shell
 * @returns {string[][]} список запросов, каждый запрос — массив терминов
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

/**
 * Объединяет наборы идентификаторов результатов в порядке появления, без дубликатов.
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
