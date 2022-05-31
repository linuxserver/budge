import {MigrationInterface, QueryRunner} from "typeorm";

export class hiddenCategories1654008868237 implements MigrationInterface {
    name = 'hiddenCategories1654008868237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_e6d5be2f8c1fbd283150e043a0"`);
        await queryRunner.query(`DROP INDEX "IDX_af173d6048d44da16b00e49e24"`);
        await queryRunner.query(`CREATE TABLE "temporary_categories" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "categoryGroupId" varchar NOT NULL, "trackingAccountId" varchar, "name" varchar NOT NULL, "inflow" boolean NOT NULL DEFAULT (0), "locked" boolean NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), "hidden" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_d05bb3b46b9b190eb9c20ad3c21" FOREIGN KEY ("categoryGroupId") REFERENCES "category_groups" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_e6d5be2f8c1fbd283150e043a08" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_categories"("id", "budgetId", "categoryGroupId", "trackingAccountId", "name", "inflow", "locked", "order", "created", "updated") SELECT "id", "budgetId", "categoryGroupId", "trackingAccountId", "name", "inflow", "locked", "order", "created", "updated" FROM "categories"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`ALTER TABLE "temporary_categories" RENAME TO "categories"`);
        await queryRunner.query(`CREATE INDEX "IDX_e6d5be2f8c1fbd283150e043a0" ON "categories" ("budgetId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_af173d6048d44da16b00e49e24" ON "categories" ("trackingAccountId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_af173d6048d44da16b00e49e24"`);
        await queryRunner.query(`DROP INDEX "IDX_e6d5be2f8c1fbd283150e043a0"`);
        await queryRunner.query(`ALTER TABLE "categories" RENAME TO "temporary_categories"`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" varchar PRIMARY KEY NOT NULL, "budgetId" varchar NOT NULL, "categoryGroupId" varchar NOT NULL, "trackingAccountId" varchar, "name" varchar NOT NULL, "inflow" boolean NOT NULL DEFAULT (0), "locked" boolean NOT NULL DEFAULT (0), "order" integer NOT NULL DEFAULT (0), "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_d05bb3b46b9b190eb9c20ad3c21" FOREIGN KEY ("categoryGroupId") REFERENCES "category_groups" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_e6d5be2f8c1fbd283150e043a08" FOREIGN KEY ("budgetId") REFERENCES "budgets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "categories"("id", "budgetId", "categoryGroupId", "trackingAccountId", "name", "inflow", "locked", "order", "created", "updated") SELECT "id", "budgetId", "categoryGroupId", "trackingAccountId", "name", "inflow", "locked", "order", "created", "updated" FROM "temporary_categories"`);
        await queryRunner.query(`DROP TABLE "temporary_categories"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_af173d6048d44da16b00e49e24" ON "categories" ("trackingAccountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e6d5be2f8c1fbd283150e043a0" ON "categories" ("budgetId") `);
    }

}
