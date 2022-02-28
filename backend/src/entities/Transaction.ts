export enum TransactionStatus {
  Pending,
  Cleared,
  Reconciled,
}

export type TransactionOriginalValues = {
  payeeId: string
  categoryId: string
  amount: number
  date: Date
  status: TransactionStatus
}

export class TransactionCache {
  static cache: { [key: string]: TransactionOriginalValues } = {}

  static transfers: string[] = []

  public static get(id: string): TransactionOriginalValues | null {
    if (TransactionCache.cache[id]) {
      return TransactionCache.cache[id]
    }

    return null
  }

  public static set(transaction: any) {
    TransactionCache.cache[transaction.id] = {
      payeeId: transaction.payeeId,
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      date: new Date(transaction.date.getTime()),
      status: transaction.status,
    }
  }

  public static enableTransfers(id: string) {
    const index = TransactionCache.transfers.indexOf(id)
    if (index === -1) {
      TransactionCache.transfers.push(id)
    }
  }

  public static disableTransfers(id: string) {
    const index = TransactionCache.transfers.indexOf(id)
    if (index > -1) {
      TransactionCache.transfers.splice(index, 1)
    }
  }

  public static transfersEnabled(id: string): boolean {
    const index = TransactionCache.transfers.indexOf(id)
    if (index > -1) {
      return true
    }

    return false
  }
}

export class Transaction {
  public getUpdatePayload() {
    // return {
    //   id: this.id,
    //   budgetId: this.budgetId,
    //   accountId: this.accountId,
    //   payeeId: this.payeeId,
    //   transferAccountId: this.transferAccountId,
    //   transferTransactionId: this.transferTransactionId,
    //   categoryId: this.categoryId,
    //   amount: this.amount,
    //   date: this.date,
    //   memo: this.memo,
    //   status: this.status,
    // }
  }
}
