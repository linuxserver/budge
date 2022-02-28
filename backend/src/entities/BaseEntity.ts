import {prisma} from '../prisma'

export default class BaseEntity {
  private data: any

  constructor(data: any) {
    this.data = data
  }

  public get(property: string) {
    return this.data[property]
  }

  public set(property: string, value: any) {
    this.data[property] = value
  }

  public static async create(data: any) {
    // const account = await prisma[this.name.toLowerCase()].create({data})
    // return new this(account)
  }
}
