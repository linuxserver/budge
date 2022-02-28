import { CategoryGroupModel } from '../models/CategoryGroup'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm'
import { Budget } from './Budget'
import { Category } from './Category'

export const CreditCardGroupName = 'Credit Card Payments'

@Entity('category_groups')
export class CategoryGroup {
  public static sort(categoryGroups: any[]): any[] {
    categoryGroups = categoryGroups.sort((a, b) => {
      if (a.order === b.order) {
        return a.name > b.name ? -1 : 1
      }
      return a.order < b.order ? -1 : 1
    })

    return categoryGroups.map((group, index) => {
      group.order = index
      return group
    })
  }
}
