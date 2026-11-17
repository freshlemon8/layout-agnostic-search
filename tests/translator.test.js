// Run: gjs -m tests/translator.test.js
import System from 'system';
import { buildQueries, mergeResults } from '../src/translator.js';

let failed = 0;

function check(name, condition) {
    if (condition) {
        print(`ok    ${name}`);
    } else {
        failed++;
        print(`FAIL  ${name}`);
    }
}

const has = (queries, query) =>
    queries.some(q => JSON.stringify(q) === JSON.stringify(query));

// Latin is not translated (only Cyrillic -> Latin)
check('firefox is not translated to Cyrillic',
    buildQueries(['firefox']).length === 1);

check('terminal is not translated to Cyrillic',
    buildQueries(['terminal']).length === 1);

check('steam is not translated to Cyrillic',
    buildQueries(['steam']).length === 1);

check('gimp is not translated to Cyrillic',
    buildQueries(['gimp']).length === 1);

// Cyrillic -> Latin
check('диски -> lbcrb (reverse translation)',
    has(buildQueries(['диски']), ['lbcrb']));

check('ашкуащч -> firefox (reverse translation)',
    has(buildQueries(['ашкуащч']), ['firefox']));

check('іеуфь -> steam (UA reverse translation)',
    has(buildQueries(['іеуфь']), ['steam']));

// Original query is always first
check('original query is first',
    JSON.stringify(buildQueries(['firefox'])[0]) === JSON.stringify(['firefox']));

// Digits and punctuation: terms with digits are not translated
const numeric = buildQueries(['gimp', '2.10']);
check('term "2.10" is not translated to any variant',
    numeric.every(q => q[1] === '2.10'));

check('query "gimp 2.10" produces no variants (Latin is not translated)',
    numeric.length === 1);

// Edge cases
check('empty list -> single query',
    JSON.stringify(buildQueries([])) === JSON.stringify([[]]));

check('single character term -> no variants',
    buildQueries(['a']).length === 1);

check('dot-only term -> no variants',
    buildQueries(['.']).length === 1);

const long = ['x'.repeat(200)];
check('query longer than limit -> no variants',
    buildQueries(long).length === 1);

// Deduplication
const dedup = buildQueries(['ааа']);
check('no duplicate queries',
    new Set(dedup.map(q => JSON.stringify(q))).size === dedup.length);

// mergeResults
const merged = mergeResults([['a', 'b'], ['b', 'c'], [], ['a', 'd']]);
check('mergeResults removes duplicates and preserves order',
    JSON.stringify(merged) === JSON.stringify(['a', 'b', 'c', 'd']));

check('mergeResults with empty input returns empty array',
    mergeResults([]).length === 0);

if (failed > 0) {
    print(`\nFailed tests: ${failed}`);
    System.exit(1);
}
print('\nAll tests passed');
