import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateBudgets1636306479238 implements MigrationInterface {
  name = 'CreateBudgets1636306479238'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "budgets" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), "userId" varchar)`,
    )
    await queryRunner.query(
      `CREATE TABLE "temporary_budgets" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), "userId" varchar, CONSTRAINT "FK_27e688ddf1ff3893b43065899f9" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    )
    await queryRunner.query(
      `INSERT INTO "temporary_budgets"("id", "name", "created", "updated", "userId") SELECT "id", "name", "created", "updated", "userId" FROM "budgets"`,
    )
    await queryRunner.query(`DROP TABLE "budgets"`)
    await queryRunner.query(`ALTER TABLE "temporary_budgets" RENAME TO "budgets"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "budgets" RENAME TO "temporary_budgets"`)
    await queryRunner.query(
      `CREATE TABLE "budgets" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), "userId" varchar)`,
    )
    await queryRunner.query(
      `INSERT INTO "budgets"("id", "name", "created", "updated", "userId") SELECT "id", "name", "created", "updated", "userId" FROM "temporary_budgets"`,
    )
    await queryRunner.query(`DROP TABLE "temporary_budgets"`)
    await queryRunner.query(`DROP TABLE "budgets"`)
  }
}
