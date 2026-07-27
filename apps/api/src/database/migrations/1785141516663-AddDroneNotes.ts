import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDroneNotes1785141516663 implements MigrationInterface {
  name = 'AddDroneNotes1785141516663';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "drones" ADD "notes" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drones" DROP COLUMN "notes"`);
  }
}
