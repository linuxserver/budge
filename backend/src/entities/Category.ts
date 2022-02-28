export class Category {
  public getUpdatePayload() {
    // return {
    //   id: this.id,
    //   budgetId: this.budgetId,
    //   categoryGroupId: this.categoryGroupId,
    //   trackingAccountId: this.trackingAccountId,
    //   name: this.name,
    //   inflow: this.inflow,
    //   locked: this.locked,
    //   order: this.order,
    // }
  }

  public static sort(categories: any[]): any[] {
    categories.sort((a, b) => {
      if (a.order === b.order) {
        return a.name < b.name ? -1 : 1
      }
      return a.order < b.order ? -1 : 1
    })

    return categories.map((cat, index) => {
      cat.order = index
      return cat
    })
  }
}
