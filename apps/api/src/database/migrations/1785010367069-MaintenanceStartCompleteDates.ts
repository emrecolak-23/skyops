import { MigrationInterface, QueryRunner } from 'typeorm';

export class MaintenanceStartCompleteDates1785010367069 implements MigrationInterface {
  name = 'MaintenanceStartCompleteDates1785010367069';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a8ae4e0d6f420dc243db831ec3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" DROP COLUMN "performed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" ADD "started_at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" ADD "completed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_016b9bb8b367b6beea6525a27f" ON "maintenance_logs" ("drone_id", "completed_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_016b9bb8b367b6beea6525a27f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" DROP COLUMN "completed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" DROP COLUMN "started_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" ADD "performed_at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8ae4e0d6f420dc243db831ec3" ON "maintenance_logs" USING btree ("drone_id", "performed_at")`,
    );
  }
}
