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
import { prisma } from '../prisma'

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
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
      },
    ],
  })
  public async getCategories(
    @Path() budgetId: string,
    @Request() request: ExpressRequest,
  ): Promise<CategoryGroupsResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroups: CategoryGroup[] = await prisma.categoryGroup.find({ where: { budgetId } })

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
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async createCategoryGroup(
    @Path() budgetId: string,
    @Body() requestBody: CategoryGroupRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryGroupResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroup: CategoryGroup = await prisma.categoryGroup.create({
        data: {
          ...requestBody,
          budgetId,
        },
      })

      return {
        message: 'success',
        data: await categoryGroup.toResponseModel(),
      }
    } catch (err) {
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
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async updateCategoryGroup(
    @Path() budgetId: string,
    @Path() id: string,
    @Body() requestBody: CategoryGroupRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryGroupResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroup = await prisma.categoryGroup.findUnique({ where: { id } })
      categoryGroup.name = requestBody.name

      if (categoryGroup.order !== requestBody.order) {
        // re-order category groups
        categoryGroup.order = requestBody.order

        let categoryGroups = (await prisma.categoryGroup.find({ where: { budgetId } })).map((group: CategoryGroup) => {
          if (group.id === categoryGroup.id) {
            return categoryGroup
          }

          return group
        })

        categoryGroups = CategoryGroup.sort(categoryGroups)

        for (const categoryGroup of categoryGroups) {
          await prisma.categoryGroup.update({ where: { id: categoryGroup.id }, data: categoryGroup })
        }
      } else {
        await prisma.categoryGroup.update({ where: { id: categoryGroup.id }, data: categoryGroup.getUpdatePayload() })
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
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async createCategory(
    @Path() budgetId: string,
    @Body() requestBody: CategoryRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const category: Category = await prisma.category.create({
        data: {
          ...requestBody,
          budgetId,
        },
      })

      return {
        message: 'success',
        data: await category.toResponseModel(),
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
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async updateCategory(
    @Path() budgetId: string,
    @Path() id: string,
    @Body() requestBody: CategoryRequest,
    @Request() request: ExpressRequest,
  ): Promise<CategoryResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const category = await prisma.category.findUnique({ where: { id } }, { includes: { categoryGroups: true } })

      const originalCategoryGroupId = category.categoryGroupId
      const updateOrder =
        category.categoryGroupId !== requestBody.categoryGroupId || category.order !== requestBody.order

      category.name = requestBody.name
      category.order = requestBody.order
      delete category.categoryGroup
      category.categoryGroupId = requestBody.categoryGroupId

      if (updateOrder === true) {
        let categories: Category[] = await prisma.category.find({
          where: { categoryGroupId: category.categoryGroupId },
        })
        if (originalCategoryGroupId !== category.categoryGroupId) {
          categories.push(category)
        } else {
          categories = categories.map(oldCategory => (oldCategory.id === category.id ? category : oldCategory))
        }

        categories = Category.sort(categories)
        for (const category of categories) {
          await prisma.category.update({ where: { id: category.id }, data: category })
        }
      } else {
        await prisma.category.update({ where: { id: category.id }, data: category.getUpdatePayload() })
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
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
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
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryMonth = await getCustomRepository(CategoryMonths).findOrCreate(budgetId, categoryId, month)
      categoryMonth.update({ budgeted: requestBody.budgeted })
      await prisma.categoryMonth.update({ where: { id: categoryMonth.id }, data: categoryMonth.getUpdatePayload() })

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
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
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
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const findParams = {
        where: {
          categoryId,
          ...(from && { month: { gte: from } }),
        },
      }
      const categoryMonths: CategoryMonth[] = await prisma.categoryMonth.find(findParams)

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
