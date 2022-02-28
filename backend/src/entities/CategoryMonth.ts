import { CategoryMonthModel } from '../models/CategoryMonth'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index, AfterLoad } from 'typeorm'
import { BudgetMonth } from './BudgetMonth'
import { Category } from './Category'
import {prisma} from '../prisma'

export type CategoryMonthOriginalValues = {
  budgeted: number
  activity: number
  balance: number
}

export class CategoryMonthCache {
  static cache: { [key: string]: CategoryMonthOriginalValues } = {}

  public static get(id: string): CategoryMonthOriginalValues | null {
    if (CategoryMonthCache.cache[id]) {
      return CategoryMonthCache.cache[id]
    }

    return {
      budgeted: 0,
      activity: 0,
      balance: 0,
    }
  }

  public static set(categoryMonth: any) {
    CategoryMonthCache.cache[categoryMonth.id] = {
      budgeted: categoryMonth.budgeted,
      activity: categoryMonth.activity,
      balance: categoryMonth.balance,
    }
  }
}

@Entity('category_months')
export class CategoryMonth {
  public static update(categoryMonth: any, { activity, budgeted }: { [key: string]: number }) {
    if (activity !== undefined) {
      categoryMonth.activity = categoryMonth.activity + activity
      categoryMonth.balance = categoryMonth.balance + activity
    }
    if (budgeted !== undefined) {
      const budgetedDifference = budgeted - categoryMonth.budgeted
      categoryMonth.budgeted = categoryMonth.budgeted + budgetedDifference
      categoryMonth.balance = categoryMonth.balance + budgetedDifference
    }
  }

  public static async findOrCreate(budgetId: string, categoryId: string, month: string): Promise<any> {
    let categoryMonth = await prisma.categoryMonth.findFirst({
      where: { categoryId, month: month },
      include: { budgetMonth: true },
    })

    if (!categoryMonth) {
      categoryMonth = await CategoryMonth.createNew(budgetId, categoryId, month)
    }

    return categoryMonth
  }

  public static async createNew(budgetId: string, categoryId: string, month: string): Promise<any> {
    const budgetMonth = await BudgetMonth.findOrCreate(budgetId, month)
    const categoryMonth = await prisma.categoryMonth.create({
      data: {
        month: month,
        category: { connect: { id: categoryId } },
        budgetMonth: { connect: { id: budgetMonth.id } },
      },
    })

    return categoryMonth
  }
}
