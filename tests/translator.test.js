// Запуск: gjs -m tests/translator.test.js
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

// Латиница не переводится (только кириллица → латиница)
check('firefox не транслируется в кириллицу',
    buildQueries(['firefox']).length === 1);

check('terminal не транслируется в кириллицу',
    buildQueries(['terminal']).length === 1);

check('steam не транслируется в кириллицу',
    buildQueries(['steam']).length === 1);

check('gimp не транслируется в кириллицу',
    buildQueries(['gimp']).length === 1);

// Кириллица → латиница
check('диски → lbcrb (обратная трансляция)',
    has(buildQueries(['диски']), ['lbcrb']));

check('ашкуащч → firefox (обратная трансляция)',
    has(buildQueries(['ашкуащч']), ['firefox']));

check('іеуфь → steam (UA обратная трансляция)',
    has(buildQueries(['іеуфь']), ['steam']));

// Исходный запрос всегда первый
check('исходный запрос первый',
    JSON.stringify(buildQueries(['firefox'])[0]) === JSON.stringify(['firefox']));

// Цифры и знаки: термин с цифрами не транслируется
const numeric = buildQueries(['gimp', '2.10']);
check('термин "2.10" не транслируется ни в один вариант',
    numeric.every(q => q[1] === '2.10'));

check('запрос "gimp 2.10" не даёт вариантов (латиница не переводится)',
    numeric.length === 1);

// Пограничные случаи
check('пустой список → один запрос',
    JSON.stringify(buildQueries([])) === JSON.stringify([[]]));

check('односимвольный термин → без вариантов',
    buildQueries(['a']).length === 1);

check('термин только из точки → без вариантов',
    buildQueries(['.']).length === 1);

const long = ['x'.repeat(200)];
check('запрос длиннее лимита → без вариантов',
    buildQueries(long).length === 1);

// Дедупликация
const dedup = buildQueries(['ааа']);
check('нет повторяющихся запросов',
    new Set(dedup.map(q => JSON.stringify(q))).size === dedup.length);

// mergeResults
const merged = mergeResults([['a', 'b'], ['b', 'c'], [], ['a', 'd']]);
check('mergeResults убирает дубли и сохраняет порядок',
    JSON.stringify(merged) === JSON.stringify(['a', 'b', 'c', 'd']));

check('mergeResults с пустым входом возвращает пустой массив',
    mergeResults([]).length === 0);

if (failed > 0) {
    print(`\nПровалено тестов: ${failed}`);
    System.exit(1);
}
print('\nВсе тесты пройдены');
