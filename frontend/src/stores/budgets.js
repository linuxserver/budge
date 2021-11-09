import { writable } from 'svelte/store';

export const budgets = writable([]);

export const activeBudget = writable({});
