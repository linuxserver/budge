import { MigrationInterface, QueryRunner } from 'typeorm'

export class initial1645039984937 implements MigrationInterface {
  name = 'initial1645039984937'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `)
    await queryRunner.query(
      `CREATE TABLE "budget_months" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "month" varchar NOT NULL, "income" integer NOT NULL DEFAULT (0), "budgeted" integer NOT NULL DEFAULT (0), "activity" integer NOT NULL DEFAULT (0), "underfunded" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_398c07457719d1899ba4f11914" ON "budget_months" ("budgetId") `)
    await queryRunner.query(`CREATE INDEX "IDX_0c21df54422306fdf78621fc18" ON "budget_months" ("month") `)
    await queryRunner.query(
      `CREATE TABLE "category_months" ("id" varchar PRIMARY KEY NOT NULL, "categoryId" varchar NOT NULL, "budgetMonthId" varchar NOT NULL, "month" varchar NOT NULL, "budgeted" integer NOT NULL DEFAULT (0), "activity" integer NOT NULL DEFAULT (0), "balance" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_cba488e36ca6ff6eec83e91440" ON "category_months" ("categoryId") `)
    await queryRunner.query(`CREATE INDEX "IDX_de0f1ed5fe7ad4f2254bb815be" ON "category_months" ("budgetMonthId") `)
    await queryRunner.query(`CREATE INDEX "IDX_23f4c8894717fb764a2b88ff29" ON "category_months" ("month") `)
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "categoryGroupId" varchar NOT NULL, "trackingAccountId" varchar, "name" varchar NOT NULL, "inflow" boolean NOT NULL DEFAULT (0), "locked" boolean NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_e6d5be2f8c1fbd283150e043a0" ON "categories" ("budgetId") `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_af173d6048d44da16b00e49e24" ON "categories" ("trackingAccountId") `,
    )
    await queryRunner.query(
      `CREATE TABLE "payees" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "transferAccountId" varchar, "name" varchar NOT NULL, "internal" boolean NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_f61fc1e67d3abfb79503cdd382" UNIQUE ("transferAccountId"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "accountId" varchar NOT NULL, "payeeId" varchar NOT NULL, "transferAccountId" varchar, "transferTransactionId" varchar, "categoryId" varchar, "amount" integer NOT NULL DEFAULT (0), "date" datetime NOT NULL, "memo" varchar NOT NULL DEFAULT (''), "status" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_7098ffeb5373b7d6344f4f1663" ON "transactions" ("transferTransactionId") `,
    )
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "transferPayeeId" varchar, "name" varchar NOT NULL, "type" integer NOT NULL, "balance" integer NOT NULL DEFAULT (0), "cleared" integer NOT NULL DEFAULT (0), "uncleared" integer NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_c2a8be4512a377b0a8614170e3" UNIQUE ("transferPayeeId"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "budgets" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar NOT NULL, "toBeBudgeted" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(
      `CREATE TABLE "category_groups" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "name" varchar NOT NULL, "internal" boolean NOT NULL DEFAULT (0), "locked" boolean NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_0dcceebef7c019bc892be7b5d0" ON "category_groups" ("budgetId") `)
    await queryRunner.query(`DROP INDEX "IDX_398c07457719d1899ba4f11914"`)
    await queryRunner.query(`DROP INDEX "IDX_0c21df54422306fdf78621fc18"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_budget_months" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "month" varchar NOT NULL, "income" integer NOT NULL DEFAULT (0), "budgeted" integer NOT NULL DEFAULT (0), "activity" integer NOT NULL DEFAULT (0), "underfunded" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_398c07457719d1899ba4f11914d" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_budget_months"("id", "budgetId", "month", "income", "budgeted", "activity", "underfunded", "created", "updated") SELECT "id", "budgetId", "month", "income", "budgeted", "activity", "underfunded", "created", "updated" FROM "budget_months"`,
    )
    await queryRunner.query(`DROP TABLE "budget_months"`)
    await queryRunner.query(`ALTER TABLE "temporary_budget_months" RENAME TO "budget_months"`)
    await queryRunner.query(`CREATE INDEX "IDX_398c07457719d1899ba4f11914" ON "budget_months" ("budgetId") `)
    await queryRunner.query(`CREATE INDEX "IDX_0c21df54422306fdf78621fc18" ON "budget_months" ("month") `)
    await queryRunner.query(`DROP INDEX "IDX_cba488e36ca6ff6eec83e91440"`)
    await queryRunner.query(`DROP INDEX "IDX_de0f1ed5fe7ad4f2254bb815be"`)
    await queryRunner.query(`DROP INDEX "IDX_23f4c8894717fb764a2b88ff29"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_category_months" ("id" varchar PRIMARY KEY NOT NULL, "categoryId" varchar NOT NULL, "budgetMonthId" varchar NOT NULL, "month" varchar NOT NULL, "budgeted" integer NOT NULL DEFAULT (0), "activity" integer NOT NULL DEFAULT (0), "balance" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_cba488e36ca6ff6eec83e914409" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_de0f1ed5fe7ad4f2254bb815bef" FOREIGN KEY ("budgetMonthId") REFERENCES "budget_months" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_category_months"("id", "categoryId", "budgetMonthId", "month", "budgeted", "activity", "balance", "created", "updated") SELECT "id", "categoryId", "budgetMonthId", "month", "budgeted", "activity", "balance", "created", "updated" FROM "category_months"`,
    )
    await queryRunner.query(`DROP TABLE "category_months"`)
    await queryRunner.query(`ALTER TABLE "temporary_category_months" RENAME TO "category_months"`)
    await queryRunner.query(`CREATE INDEX "IDX_cba488e36ca6ff6eec83e91440" ON "category_months" ("categoryId") `)
    await queryRunner.query(`CREATE INDEX "IDX_de0f1ed5fe7ad4f2254bb815be" ON "category_months" ("budgetMonthId") `)
    await queryRunner.query(`CREATE INDEX "IDX_23f4c8894717fb764a2b88ff29" ON "category_months" ("month") `)
    await queryRunner.query(`DROP INDEX "IDX_e6d5be2f8c1fbd283150e043a0"`)
    await queryRunner.query(`DROP INDEX "IDX_af173d6048d44da16b00e49e24"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_categories" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "categoryGroupId" varchar NOT NULL, "trackingAccountId" varchar, "name" varchar NOT NULL, "inflow" boolean NOT NULL DEFAULT (0), "locked" boolean NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_e6d5be2f8c1fbd283150e043a08" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_d05bb3b46b9b190eb9c20ad3c21" FOREIGN KEY ("categoryGroupId") REFERENCES "category_groups" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_categories"("id", "budgetId", "categoryGroupId", "trackingAccountId", "name", "inflow", "locked", "order", "created", "updated") SELECT "id", "budgetId", "categoryGroupId", "trackingAccountId", "name", "inflow", "locked", "order", "created", "updated" FROM "categories"`,
    )
    await queryRunner.query(`DROP TABLE "categories"`)
    await queryRunner.query(`ALTER TABLE "temporary_categories" RENAME TO "categories"`)
    await queryRunner.query(`CREATE INDEX "IDX_e6d5be2f8c1fbd283150e043a0" ON "categories" ("budgetId") `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_af173d6048d44da16b00e49e24" ON "categories" ("trackingAccountId") `,
    )
    await queryRunner.query(
      `CREATE TABLE "temporary_payees" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "transferAccountId" varchar, "name" varchar NOT NULL, "internal" boolean NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_f61fc1e67d3abfb79503cdd382" UNIQUE ("transferAccountId"), CONSTRAINT "FK_f61fc1e67d3abfb79503cdd3821" FOREIGN KEY ("transferAccountId") REFERENCES "accounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_payees"("id", "budgetId", "transferAccountId", "name", "internal", "created", "updated") SELECT "id", "budgetId", "transferAccountId", "name", "internal", "created", "updated" FROM "payees"`,
    )
    await queryRunner.query(`DROP TABLE "payees"`)
    await queryRunner.query(`ALTER TABLE "temporary_payees" RENAME TO "payees"`)
    await queryRunner.query(`DROP INDEX "IDX_7098ffeb5373b7d6344f4f1663"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_transactions" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "accountId" varchar NOT NULL, "payeeId" varchar NOT NULL, "transferAccountId" varchar, "transferTransactionId" varchar, "categoryId" varchar, "amount" integer NOT NULL DEFAULT (0), "date" datetime NOT NULL, "memo" varchar NOT NULL DEFAULT (''), "status" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_9552f6354aafa8f1818aa571aaf" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_44075a45926dfce0379d2c81c83" FOREIGN KEY ("payeeId") REFERENCES "payees" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_86e965e74f9cc66149cf6c90f64" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_transactions"("id", "budgetId", "accountId", "payeeId", "transferAccountId", "transferTransactionId", "categoryId", "amount", "date", "memo", "status", "created", "updated") SELECT "id", "budgetId", "accountId", "payeeId", "transferAccountId", "transferTransactionId", "categoryId", "amount", "date", "memo", "status", "created", "updated" FROM "transactions"`,
    )
    await queryRunner.query(`DROP TABLE "transactions"`)
    await queryRunner.query(`ALTER TABLE "temporary_transactions" RENAME TO "transactions"`)
    await queryRunner.query(
      `CREATE INDEX "IDX_7098ffeb5373b7d6344f4f1663" ON "transactions" ("transferTransactionId") `,
    )
    await queryRunner.query(
      `CREATE TABLE "temporary_accounts" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "transferPayeeId" varchar, "name" varchar NOT NULL, "type" integer NOT NULL, "balance" integer NOT NULL DEFAULT (0), "cleared" integer NOT NULL DEFAULT (0), "uncleared" integer NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_c2a8be4512a377b0a8614170e3" UNIQUE ("transferPayeeId"), CONSTRAINT "FK_81acfbf2205a3be5b1c41455329" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_c2a8be4512a377b0a8614170e33" FOREIGN KEY ("transferPayeeId") REFERENCES "payees" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_accounts"("id", "budgetId", "transferPayeeId", "name", "type", "balance", "cleared", "uncleared", "order", "created", "updated") SELECT "id", "budgetId", "transferPayeeId", "name", "type", "balance", "cleared", "uncleared", "order", "created", "updated" FROM "accounts"`,
    )
    await queryRunner.query(`DROP TABLE "accounts"`)
    await queryRunner.query(`ALTER TABLE "temporary_accounts" RENAME TO "accounts"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_budgets" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar NOT NULL, "toBeBudgeted" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_27e688ddf1ff3893b43065899f9" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_budgets"("id", "userId", "name", "toBeBudgeted", "created", "updated") SELECT "id", "userId", "name", "toBeBudgeted", "created", "updated" FROM "budgets"`,
    )
    await queryRunner.query(`DROP TABLE "budgets"`)
    await queryRunner.query(`ALTER TABLE "temporary_budgets" RENAME TO "budgets"`)
    await queryRunner.query(`DROP INDEX "IDX_0dcceebef7c019bc892be7b5d0"`)
    await queryRunner.query(
      `CREATE TABLE "temporary_category_groups" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "name" varchar NOT NULL, "internal" boolean NOT NULL DEFAULT (0), "locked" boolean NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_0dcceebef7c019bc892be7b5d0e" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_category_groups"("id", "budgetId", "name", "internal", "locked", "order", "created", "updated") SELECT "id", "budgetId", "name", "internal", "locked", "order", "created", "updated" FROM "category_groups"`,
    )
    await queryRunner.query(`DROP TABLE "category_groups"`)
    await queryRunner.query(`ALTER TABLE "temporary_category_groups" RENAME TO "category_groups"`)
    await queryRunner.query(`CREATE INDEX "IDX_0dcceebef7c019bc892be7b5d0" ON "category_groups" ("budgetId") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_0dcceebef7c019bc892be7b5d0"`)
    await queryRunner.query(`ALTER TABLE "category_groups" RENAME TO "temporary_category_groups"`)
    await queryRunner.query(
      `CREATE TABLE "category_groups" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "name" varchar NOT NULL, "internal" boolean NOT NULL DEFAULT (0), "locked" boolean NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(
      `INSERT INTO "category_groups"("id", "budgetId", "name", "internal", "locked", "order", "created", "updated") SELECT "id", "budgetId", "name", "internal", "locked", "order", "created", "updated" FROM "temporary_category_groups"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_category_groups"`)
    await queryRunner.query(`CREATE INDEX "IDX_0dcceebef7c019bc892be7b5d0" ON "category_groups" ("budgetId") `)
    await queryRunner.query(`ALTER TABLE "budgets" RENAME TO "temporary_budgets"`)
    await queryRunner.query(
      `CREATE TABLE "budgets" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar NOT NULL, "toBeBudgeted" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(
      `INSERT INTO "budgets"("id", "userId", "name", "toBeBudgeted", "created", "updated") SELECT "id", "userId", "name", "toBeBudgeted", "created", "updated" FROM "temporary_budgets"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_budgets"`)
    await queryRunner.query(`ALTER TABLE "accounts" RENAME TO "temporary_accounts"`)
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "transferPayeeId" varchar, "name" varchar NOT NULL, "type" integer NOT NULL, "balance" integer NOT NULL DEFAULT (0), "cleared" integer NOT NULL DEFAULT (0), "uncleared" integer NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_c2a8be4512a377b0a8614170e3" UNIQUE ("transferPayeeId"))`,
    )
    await queryRunner.query(
      `INSERT INTO "accounts"("id", "budgetId", "transferPayeeId", "name", "type", "balance", "cleared", "uncleared", "order", "created", "updated") SELECT "id", "budgetId", "transferPayeeId", "name", "type", "balance", "cleared", "uncleared", "order", "created", "updated" FROM "temporary_accounts"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_accounts"`)
    await queryRunner.query(`DROP INDEX "IDX_7098ffeb5373b7d6344f4f1663"`)
    await queryRunner.query(`ALTER TABLE "transactions" RENAME TO "temporary_transactions"`)
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "accountId" varchar NOT NULL, "payeeId" varchar NOT NULL, "transferAccountId" varchar, "transferTransactionId" varchar, "categoryId" varchar, "amount" integer NOT NULL DEFAULT (0), "date" datetime NOT NULL, "memo" varchar NOT NULL DEFAULT (''), "status" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(
      `INSERT INTO "transactions"("id", "budgetId", "accountId", "payeeId", "transferAccountId", "transferTransactionId", "categoryId", "amount", "date", "memo", "status", "created", "updated") SELECT "id", "budgetId", "accountId", "payeeId", "transferAccountId", "transferTransactionId", "categoryId", "amount", "date", "memo", "status", "created", "updated" FROM "temporary_transactions"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_transactions"`)
    await queryRunner.query(
      `CREATE INDEX "IDX_7098ffeb5373b7d6344f4f1663" ON "transactions" ("transferTransactionId") `,
    )
    await queryRunner.query(`ALTER TABLE "payees" RENAME TO "temporary_payees"`)
    await queryRunner.query(
      `CREATE TABLE "payees" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "transferAccountId" varchar, "name" varchar NOT NULL, "internal" boolean NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "REL_f61fc1e67d3abfb79503cdd382" UNIQUE ("transferAccountId"))`,
    )
    await queryRunner.query(
      `INSERT INTO "payees"("id", "budgetId", "transferAccountId", "name", "internal", "created", "updated") SELECT "id", "budgetId", "transferAccountId", "name", "internal", "created", "updated" FROM "temporary_payees"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_payees"`)
    await queryRunner.query(`DROP INDEX "IDX_af173d6048d44da16b00e49e24"`)
    await queryRunner.query(`DROP INDEX "IDX_e6d5be2f8c1fbd283150e043a0"`)
    await queryRunner.query(`ALTER TABLE "categories" RENAME TO "temporary_categories"`)
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "categoryGroupId" varchar NOT NULL, "trackingAccountId" varchar, "name" varchar NOT NULL, "inflow" boolean NOT NULL DEFAULT (0), "locked" boolean NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(
      `INSERT INTO "categories"("id", "budgetId", "categoryGroupId", "trackingAccountId", "name", "inflow", "locked", "order", "created", "updated") SELECT "id", "budgetId", "categoryGroupId", "trackingAccountId", "name", "inflow", "locked", "order", "created", "updated" FROM "temporary_categories"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_categories"`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_af173d6048d44da16b00e49e24" ON "categories" ("trackingAccountId") `,
    )
    await queryRunner.query(`CREATE INDEX "IDX_e6d5be2f8c1fbd283150e043a0" ON "categories" ("budgetId") `)
    await queryRunner.query(`DROP INDEX "IDX_23f4c8894717fb764a2b88ff29"`)
    await queryRunner.query(`DROP INDEX "IDX_de0f1ed5fe7ad4f2254bb815be"`)
    await queryRunner.query(`DROP INDEX "IDX_cba488e36ca6ff6eec83e91440"`)
    await queryRunner.query(`ALTER TABLE "category_months" RENAME TO "temporary_category_months"`)
    await queryRunner.query(
      `CREATE TABLE "category_months" ("id" varchar PRIMARY KEY NOT NULL, "categoryId" varchar NOT NULL, "budgetMonthId" varchar NOT NULL, "month" varchar NOT NULL, "budgeted" integer NOT NULL DEFAULT (0), "activity" integer NOT NULL DEFAULT (0), "balance" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(
      `INSERT INTO "category_months"("id", "categoryId", "budgetMonthId", "month", "budgeted", "activity", "balance", "created", "updated") SELECT "id", "categoryId", "budgetMonthId", "month", "budgeted", "activity", "balance", "created", "updated" FROM "temporary_category_months"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_category_months"`)
    await queryRunner.query(`CREATE INDEX "IDX_23f4c8894717fb764a2b88ff29" ON "category_months" ("month") `)
    await queryRunner.query(`CREATE INDEX "IDX_de0f1ed5fe7ad4f2254bb815be" ON "category_months" ("budgetMonthId") `)
    await queryRunner.query(`CREATE INDEX "IDX_cba488e36ca6ff6eec83e91440" ON "category_months" ("categoryId") `)
    await queryRunner.query(`DROP INDEX "IDX_0c21df54422306fdf78621fc18"`)
    await queryRunner.query(`DROP INDEX "IDX_398c07457719d1899ba4f11914"`)
    await queryRunner.query(`ALTER TABLE "budget_months" RENAME TO "temporary_budget_months"`)
    await queryRunner.query(
      `CREATE TABLE "budget_months" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "month" varchar NOT NULL, "income" integer NOT NULL DEFAULT (0), "budgeted" integer NOT NULL DEFAULT (0), "activity" integer NOT NULL DEFAULT (0), "underfunded" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
    await queryRunner.query(
      `INSERT INTO "budget_months"("id", "budgetId", "month", "income", "budgeted", "activity", "underfunded", "created", "updated") SELECT "id", "budgetId", "month", "income", "budgeted", "activity", "underfunded", "created", "updated" FROM "temporary_budget_months"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_budget_months"`)
    await queryRunner.query(`CREATE INDEX "IDX_0c21df54422306fdf78621fc18" ON "budget_months" ("month") `)
    await queryRunner.query(`CREATE INDEX "IDX_398c07457719d1899ba4f11914" ON "budget_months" ("budgetId") `)
    await queryRunner.query(`DROP INDEX "IDX_0dcceebef7c019bc892be7b5d0"`)
    await queryRunner.query(`DROP TABLE "category_groups"`)
    await queryRunner.query(`DROP TABLE "budgets"`)
    await queryRunner.query(`DROP TABLE "accounts"`)
    await queryRunner.query(`DROP INDEX "IDX_7098ffeb5373b7d6344f4f1663"`)
    await queryRunner.query(`DROP TABLE "transactions"`)
    await queryRunner.query(`DROP TABLE "payees"`)
    await queryRunner.query(`DROP INDEX "IDX_af173d6048d44da16b00e49e24"`)
    await queryRunner.query(`DROP INDEX "IDX_e6d5be2f8c1fbd283150e043a0"`)
    await queryRunner.query(`DROP TABLE "categories"`)
    await queryRunner.query(`DROP INDEX "IDX_23f4c8894717fb764a2b88ff29"`)
    await queryRunner.query(`DROP INDEX "IDX_de0f1ed5fe7ad4f2254bb815be"`)
    await queryRunner.query(`DROP INDEX "IDX_cba488e36ca6ff6eec83e91440"`)
    await queryRunner.query(`DROP TABLE "category_months"`)
    await queryRunner.query(`DROP INDEX "IDX_0c21df54422306fdf78621fc18"`)
    await queryRunner.query(`DROP INDEX "IDX_398c07457719d1899ba4f11914"`)
    await queryRunner.query(`DROP TABLE "budget_months"`)
    await queryRunner.query(`DROP INDEX "IDX_97672ac88f789774dd47f7c8be"`)
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
