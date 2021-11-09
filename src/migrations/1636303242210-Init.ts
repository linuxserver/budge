import { MigrationInterface, QueryRunner } from 'typeorm'

export class Init1636303242210 implements MigrationInterface {
  name = 'Init1636303242210'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_97672ac88f789774dd47f7c8be"`)
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
