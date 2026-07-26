import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaintenanceStatus1785009924117 implements MigrationInterface {
  name = 'AddMaintenanceStatus1785009924117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."maintenance_logs_status_enum" AS ENUM('IN_PROGRESS', 'COMPLETED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" ADD "status" "public"."maintenance_logs_status_enum" NOT NULL DEFAULT 'IN_PROGRESS'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd9564846e22105d28f4587f7b" ON "maintenance_logs" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd9564846e22105d28f4587f7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."maintenance_logs_status_enum"`,
    );
  }
}
