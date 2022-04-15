import { MigrationInterface, QueryRunner } from 'typeorm'

export class budgetMonthAvailable1649260258195 implements MigrationInterface {
  name = 'budgetMonthAvailable1649260258195'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_budgets" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_27e688ddf1ff3893b43065899f9" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_budgets"("id", "userId", "name", "created", "updated") SELECT "id", "userId", "name", "created", "updated" FROM "budgets"`,
    )
    await queryRunner.query(`DROP TABLE "budgets"`)
    await queryRunner.query(`ALTER TABLE "temporary_budgets" RENAME TO "budgets"`)
    await queryRunner.query(`DROP INDEX "IDX_0c21df54422306fdf78621fc18"`)
    await queryRunner.query(`DROP INDEX "IDX_398c07457719d1899ba4f11914"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_budget_months" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "month" varchar NOT NULL, "income" integer NOT NULL DEFAULT (0), "budgeted" integer NOT NULL DEFAULT (0), "activity" integer NOT NULL DEFAULT (0), "underfunded" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), "available" integer NOT NULL DEFAULT (0), CONSTRAINT "FK_398c07457719d1899ba4f11914d" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_budget_months"("id", "budgetId", "month", "income", "budgeted", "activity", "underfunded", "created", "updated") SELECT "id", "budgetId", "month", "income", "budgeted", "activity", "underfunded", "created", "updated" FROM "budget_months"`,
    )
    await queryRunner.query(`DROP TABLE "budget_months"`)
    await queryRunner.query(`ALTER TABLE "temporary_budget_months" RENAME TO "budget_months"`)
    await queryRunner.query(`CREATE INDEX "IDX_0c21df54422306fdf78621fc18" ON "budget_months" ("month") `)
    await queryRunner.query(`CREATE INDEX "IDX_398c07457719d1899ba4f11914" ON "budget_months" ("budgetId") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_398c07457719d1899ba4f11914"`)
    await queryRunner.query(`DROP INDEX "IDX_0c21df54422306fdf78621fc18"`)
    await queryRunner.query(`ALTER TABLE "budget_months" RENAME TO "temporary_budget_months"`)
    await queryRunner.query(
      `CREATE TABLE "budget_months" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "month" varchar NOT NULL, "income" integer NOT NULL DEFAULT (0), "budgeted" integer NOT NULL DEFAULT (0), "activity" integer NOT NULL DEFAULT (0), "underfunded" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_398c07457719d1899ba4f11914d" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "budget_months"("id", "budgetId", "month", "income", "budgeted", "activity", "underfunded", "created", "updated") SELECT "id", "budgetId", "month", "income", "budgeted", "activity", "underfunded", "created", "updated" FROM "temporary_budget_months"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_budget_months"`)
    await queryRunner.query(`CREATE INDEX "IDX_398c07457719d1899ba4f11914" ON "budget_months" ("budgetId") `)
    await queryRunner.query(`CREATE INDEX "IDX_0c21df54422306fdf78621fc18" ON "budget_months" ("month") `)
    await queryRunner.query(`ALTER TABLE "budgets" RENAME TO "temporary_budgets"`)
    await queryRunner.query(
      `CREATE TABLE "budgets" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar NOT NULL, "toBeBudgeted" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_27e688ddf1ff3893b43065899f9" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "budgets"("id", "userId", "name", "created", "updated") SELECT "id", "userId", "name", "created", "updated" FROM "temporary_budgets"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_budgets"`)
  }
}
