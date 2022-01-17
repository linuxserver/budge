import { createSelectorCreator, defaultMemoize } from 'reselect'

// create a "selector creator" that uses lodash.isequal instead of ===
export const createDeepEqualSelector = createSelectorCreator(defaultMemoize, _.isEqual)
