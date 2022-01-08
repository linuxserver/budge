import { dinero } from 'dinero.js'
import { USD } from '@dinero.js/currencies'

export class CurrencyDBTransformer {
  to(entityValue: any) {
    if (!entityValue) {
      entityValue = dinero({ amount: 0, currency: USD })
    }
    if (typeof entityValue === 'number') {
      return entityValue
    }
    return entityValue.toJSON().amount
  }

  from(dbValue: any) {
    if (!dbValue) {
      dbValue = 0
    }
    if (dbValue instanceof Object) {
      return dbValue
    }
    return dinero({ amount: dbValue, currency: USD })
  }
}
