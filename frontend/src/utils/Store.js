import { createSelectorCreator, defaultMemoize } from 'reselect'
import _ from 'lodash'

// create a "selector creator" that uses lodash.isequal instead of ===
export const createDeepEqualSelector = createSelectorCreator(defaultMemoize, _.isEqual)
