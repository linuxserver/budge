import { Get, Put, Route, Path, Security, Post, Patch, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { CategoryGroup } from '../entities/CategoryGroup'
import { CategoryGroupRequest, CategoryGroupResponse, CategoryGroupsResponse } from '../schemas/category_group'
import { CategoryResponse } from '../schemas/category'
import { CategoryRequest } from '../schemas/category'
import { Category } from '../entities/Category'
import { CategoryMonthRequest, CategoryMonthResponse, CategoryMonthsResponse } from '../schemas/category_month'
import { CategoryMonth } from '../entities/CategoryMonth'
import { BudgetMonth } from '../entities/BudgetMonth'

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
        categories: [],
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
      },
    ]
  })
  public async getCategories(
    @Path() budgetId: string,
    @Request() request: ExpressRequest,
  ): Promise<CategoryGroupsResponse | ErrorResponse> {
    try {
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroups: CategoryGroup[] = await CategoryGroup.find({ where: { budgetId } })

      return {
        message: 'success',
        data: await Promise.all(categoryGroups.map(categoryGroup => categoryGroup.sanitize())),
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
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroup: CategoryGroup = CategoryGroup.create({
        ...requestBody,
        budgetId,
      })
      await categoryGroup.save()

      return {
        message: 'success',
        data: await categoryGroup.sanitize(),
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
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const categoryGroup = await CategoryGroup.findOne(id)
      categoryGroup.name = requestBody.name
      await categoryGroup.save()

      return {
        message: 'success',
        data: await categoryGroup.sanitize(),
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
      name: 'Expenses',
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
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const category: Category = Category.create({
        ...requestBody,
        budgetId,
      })
      await category.save()

      return {
        message: 'success',
        data: await category.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Update a category
   */
  @Security('jwtRequired')
  @Put("{id}")
  @Example<CategoryResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      categoryGroupId: 'def456',
      name: 'Expenses',
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
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const category = await Category.findOne(id, { relations: ["categoryGroup"] })

      category.name = requestBody.name
      if (category.categoryGroupId !== requestBody.categoryGroupId) {
        delete category.categoryGroup
        category.categoryGroupId = requestBody.categoryGroupId
      }

      await category.save()

      return {
        message: 'success',
        data: await category.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Update category month
   */
  @Security('jwtRequired')
  @Put("{categoryId}/{month}")
  @Example<CategoryMonthResponse>({
    message: 'success',
    data: {
      id: "jkl789",
      categoryId: "ghi135",
      month: "2021-10-01",
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
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        console.log('here')
        return {
          message: 'Not found',
        }
      }

      const categoryMonth = await CategoryMonth.findOrCreate(budgetId, categoryId, month)
      await categoryMonth.update({ budgeted: requestBody.budgeted})

      return {
        message: 'success',
        data: await categoryMonth.sanitize(),
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
  @Get("{categoryId}/months")
  @Example<CategoryMonthsResponse>({
    message: 'success',
    data: [
      {
        id: "jkl789",
        categoryId: "ghi135",
        month: "2021-10-01",
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
  ): Promise<CategoryMonthsResponse | ErrorResponse> {
    try {
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        console.log('here')
        return {
          message: 'Not found',
        }
      }

      const categoryMonths = await CategoryMonth.find({ categoryId })

      return {
        message: 'success',
        data: await Promise.all(categoryMonths.map(categoryMonth => categoryMonth.sanitize())),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }
}
