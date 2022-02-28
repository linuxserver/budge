import { Get, Put, Route, Path, Security, Post, Body, Controller, Tags, Request, Example, Query } from 'tsoa'
import { Budget } from '../entities/Budget'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { CategoryGroup } from '../entities/CategoryGroup'
import { CategoryGroupRequest, CategoryGroupResponse, CategoryGroupsResponse } from '../models/CategoryGroup'
import { CategoryResponse } from '../models/Category'
import { CategoryRequest } from '../models/Category'
import { Category } from '../entities/Category'
import { CategoryMonthRequest, CategoryMonthResponse, CategoryMonthsResponse } from '../models/CategoryMonth'
import { CategoryMonth } from '../entities/CategoryMonth'
import { getCustomRepository, getRepository, MoreThanOrEqual } from 'typeorm'
import { CategoryMonths } from '../repositories/CategoryMonths'

@Tags('Categories')
@Route('budgets/{budgetId}/categories')
export class CategoriesController extends Controller {
  /**
   * Find all budget categories and category groups
   */
  @Security('jwtRequired')
  @Get()
  @Example<CategoryGroupsResponse>({
    message: 'success',
    data: [
      {
        id: 'abc123',
        budgetId: 'def456',
        name: 'Emergency Fund',
        locked: false,
        internal: false,
        order: 0,
        categories: [],
        created: new Date('2011-10-05T14:48:00.000Z'),
        updated: new Date('2011-10-05T14:48:00.000Z'),
      },
    ],
  })
  public async getCategories(
    @Path() budgetId: string,
    @Request() request: ExpressRequest,
  ): Promise<CategoryGroupsResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroups: CategoryGroup[] = await getRepository(CategoryGroup).find({ where: { budgetId } })

      return {
        message: 'success',
        data: await Promise.all(categoryGroups.map(categoryGroup => categoryGroup.toResponseModel())),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Create new category group
   */
  @Security('jwtRequired')
  @Post('groups')
  @Example<CategoryGroupResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      name: 'Expenses',
      locked: false,
      internal: false,
      order: 0,
      categories: [],
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async createCategoryGroup(
    @Path() budgetId: string,
    @Body() requestBody: CategoryGroupRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryGroupResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroup: CategoryGroup = getRepository(CategoryGroup).create({
        ...requestBody,
        budgetId,
      })
      await getRepository(CategoryGroup).insert(categoryGroup)

      let categoryGroups = await getRepository(CategoryGroup).find({ budgetId })
      categoryGroups = CategoryGroup.sort(categoryGroups)
      await getRepository(CategoryGroup).save(categoryGroups)

      return {
        message: 'success',
        data: await categoryGroups.find(catGroup => catGroup.id === categoryGroup.id).toResponseModel(),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Update a category group
   */
  @Security('jwtRequired')
  @Put('groups/{id}')
  @Example<CategoryGroupResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      name: 'Expenses',
      locked: false,
      internal: false,
      order: 0,
      categories: [],
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async updateCategoryGroup(
    @Path() budgetId: string,
    @Path() id: string,
    @Body() requestBody: CategoryGroupRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryGroupResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroup = await getRepository(CategoryGroup).findOne(id)
      categoryGroup.name = requestBody.name

      if (categoryGroup.order !== requestBody.order) {
        // re-order category groups
        categoryGroup.order = requestBody.order

        let categoryGroups = (await getRepository(CategoryGroup).find({ budgetId })).map(group => {
          if (group.id === categoryGroup.id) {
            return categoryGroup
          }

          return group
        })

        categoryGroups = CategoryGroup.sort(categoryGroups)

        await getRepository(CategoryGroup).save(categoryGroups)
      } else {
        await getRepository(CategoryGroup).update(categoryGroup.id, categoryGroup.getUpdatePayload())
      }

      return {
        message: 'success',
        data: await categoryGroup.toResponseModel(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Create new category
   */
  @Security('jwtRequired')
  @Post()
  @Example<CategoryResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      categoryGroupId: 'def456',
      trackingAccountId: null,
      name: 'Expenses',
      inflow: false,
      locked: false,
      order: 0,
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async createCategory(
    @Path() budgetId: string,
    @Body() requestBody: CategoryRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const category: Category = getRepository(Category).create({
        ...requestBody,
        budgetId,
      })
      await getRepository(Category).insert(category)

      let categories = await getRepository(Category).find({ categoryGroupId: category.categoryGroupId })
      categories = Category.sort(categories)
      await getRepository(Category).save(categories)

      return {
        message: 'success',
        data: await categories.find(cat => cat.id === category.id).toResponseModel(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Update a category
   */
  @Security('jwtRequired')
  @Put('{id}')
  @Example<CategoryResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      categoryGroupId: 'def456',
      trackingAccountId: null,
      name: 'Expenses',
      inflow: false,
      locked: false,
      order: 0,
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async updateCategory(
    @Path() budgetId: string,
    @Path() id: string,
    @Body() requestBody: CategoryRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const category = await getRepository(Category).findOne(id, { relations: ['categoryGroup'] })

      const originalCategoryGroupId = category.categoryGroupId
      const updateOrder =
        category.categoryGroupId !== requestBody.categoryGroupId || category.order !== requestBody.order

      category.name = requestBody.name
      category.order = requestBody.order
      delete category.categoryGroup
      category.categoryGroupId = requestBody.categoryGroupId

      if (updateOrder === true) {
        let categories = await getRepository(Category).find({ categoryGroupId: category.categoryGroupId })
        if (originalCategoryGroupId !== category.categoryGroupId) {
          categories.push(category)
        } else {
          categories = categories.map(oldCategory => (oldCategory.id === category.id ? category : oldCategory))
        }

        categories = Category.sort(categories)
        await getRepository(Category).save(categories)
      } else {
        await getRepository(Category).update(category.id, category.getUpdatePayload())
      }

      return {
        message: 'success',
        data: await category.toResponseModel(),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Update category month
   */
  @Security('jwtRequired')
  @Put('{categoryId}/{month}')
  @Example<CategoryMonthResponse>({
    message: 'success',
    data: {
      id: 'jkl789',
      categoryId: 'ghi135',
      month: '2021-10-01',
      budgeted: 0,
      activity: 0,
      balance: 0,
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async updateCategoryMonth(
    @Path() budgetId: string,
    @Path() categoryId: string,
    @Path() month: string,
    @Body() requestBody: CategoryMonthRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryMonthResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryMonth = await getCustomRepository(CategoryMonths).findOrCreate(budgetId, categoryId, month)
      categoryMonth.update({ budgeted: requestBody.budgeted })
      await getRepository(CategoryMonth).update(categoryMonth.id, categoryMonth.getUpdatePayload())

      return {
        message: 'success',
        data: await categoryMonth.toResponseModel(),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Get all months for a category
   */
  @Security('jwtRequired')
  @Get('{categoryId}/months')
  @Example<CategoryMonthsResponse>({
    message: 'success',
    data: [
      {
        id: 'jkl789',
        categoryId: 'ghi135',
        month: '2021-10-01',
        budgeted: 0,
        activity: 0,
        balance: 0,
        created: new Date('2011-10-05T14:48:00.000Z'),
        updated: new Date('2011-10-05T14:48:00.000Z'),
      },
    ],
  })
  public async getCategoryMonths(
    @Path() budgetId: string,
    @Path() categoryId: string,
    @Request() request: ExpressRequest,
    @Query() from?: string,
  ): Promise<CategoryMonthsResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const findParams = {
        where: {
          categoryId,
          ...(from && { month: MoreThanOrEqual(from) }),
        },
      }
      const categoryMonths = await getRepository(CategoryMonth).find(findParams)

      return {
        message: 'success',
        data: await Promise.all(categoryMonths.map(categoryMonth => categoryMonth.toResponseModel())),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }
}
