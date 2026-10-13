// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Vladislav Tereshchenko

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { buildQueries, mergeResults } from './translator.js';

// Подтверждено в NOTES.md: getSubsearchResultSet вызывает getInitialResultSet.
const PATCH_SUBSEARCH = false;

function findAppProvider() {
    return Main.overview.searchController._searchResults._providers
        .find(provider => provider?.constructor?.name === 'AppSearchProvider') ?? null;
}

function findOwner(obj, name) {
    let current = obj;
    while (current !== null && current !== undefined) {
        if (Object.prototype.hasOwnProperty.call(current, name))
            return current;
        current = Object.getPrototypeOf(current);
    }
    return null;
}

function makeInitialPatch(original) {
    return async function (terms, cancellable) {
        const queries = buildQueries(terms);
        if (queries.length === 1)
            return original.call(this, terms, cancellable);

        const run = async query => original.call(this, query, cancellable);

        const results = await Promise.all(queries.map((query, index) =>
            run(query).catch(error => {
                if (index === 0 || cancellable?.is_cancelled())
                    throw error;
                return [];
            })));

        return mergeResults(results);
    };
}

function makeSubsearchPatch(patchedInitial) {
    return async function (previousResults, terms, cancellable) {
        return patchedInitial.call(this, terms, cancellable);
    };
}

export default class LayoutAgnosticSearchExtension extends Extension {
    enable() {
        this._patches = [];

        try {
            const provider = findAppProvider();
            if (!provider)
                throw new Error('AppSearchProvider instance not found (см. NOTES.md, PROVIDER_PATH)');

            const initialOwner = findOwner(provider, 'getInitialResultSet');
            if (!initialOwner)
                throw new Error('getInitialResultSet not found');

            const originalInitial = initialOwner.getInitialResultSet;
            const patchedInitial = makeInitialPatch(originalInitial);
            this._install(initialOwner, 'getInitialResultSet', originalInitial, patchedInitial);

            if (PATCH_SUBSEARCH) {
                const subOwner = findOwner(provider, 'getSubsearchResultSet');
                if (!subOwner)
                    throw new Error('getSubsearchResultSet not found');

                const originalSub = subOwner.getSubsearchResultSet;
                this._install(subOwner, 'getSubsearchResultSet', originalSub,
                    makeSubsearchPatch(patchedInitial));
            }
        } catch (error) {
            this.disable();
            throw error;
        }
    }

    _install(owner, name, original, patched) {
        owner[name] = patched;
        this._patches.push({ owner, name, original, patched });
    }

    disable() {
        for (const { owner, name, original, patched } of this._patches ?? []) {
            if (owner[name] === patched) {
                owner[name] = original;
            } else {
                console.warn(`layout-agnostic-search: ${name} был заменён другим кодом, откат пропущен`);
            }
        }
        this._patches = [];
    }
}
