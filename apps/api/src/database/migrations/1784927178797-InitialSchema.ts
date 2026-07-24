import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1784927178797 implements MigrationInterface {
  name = 'InitialSchema1784927178797';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);
    await queryRunner.query(
      `CREATE TYPE "public"."drones_model_enum" AS ENUM('PHANTOM_4', 'MATRICE_300', 'MAVIC_3_ENTERPRISE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."drones_status_enum" AS ENUM('AVAILABLE', 'IN_MISSION', 'MAINTENANCE', 'RETIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "drones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "serial_number" character varying(20) NOT NULL, "model" "public"."drones_model_enum" NOT NULL, "status" "public"."drones_status_enum" NOT NULL DEFAULT 'AVAILABLE', "total_flight_hours" numeric(8,2) NOT NULL DEFAULT '0', "last_maintenance_date" TIMESTAMP WITH TIME ZONE, "next_maintenance_due_date" TIMESTAMP WITH TIME ZONE, "flight_hours_at_last_maintenance" numeric(8,2) NOT NULL DEFAULT '0', "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c58fb0d50272dda6c64e7ee3acf" UNIQUE ("serial_number"), CONSTRAINT "PK_3137fc855d37186eeccd193569f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c58fb0d50272dda6c64e7ee3ac" ON "drones"  ("serial_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e98f851ed2140771d18682f52d" ON "drones"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0cc93fd277578b7f3aaf4d0d2a" ON "drones"  ("next_maintenance_due_date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missions_type_enum" AS ENUM('WIND_TURBINE_INSPECTION', 'SOLAR_PANEL_SURVEY', 'POWER_LINE_PATROL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missions_status_enum" AS ENUM('PLANNED', 'PRE_FLIGHT_CHECK', 'IN_PROGRESS', 'COMPLETED', 'ABORTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "missions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(200) NOT NULL, "type" "public"."missions_type_enum" NOT NULL, "drone_id" uuid NOT NULL, "pilot_name" character varying(120) NOT NULL, "site_location" character varying(200) NOT NULL, "status" "public"."missions_status_enum" NOT NULL DEFAULT 'PLANNED', "planned_start" TIMESTAMP WITH TIME ZONE NOT NULL, "planned_end" TIMESTAMP WITH TIME ZONE NOT NULL, "actual_start" TIMESTAMP WITH TIME ZONE, "actual_end" TIMESTAMP WITH TIME ZONE, "flight_hours_logged" numeric(8,2), "abort_reason" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_787aebb1ac5923c9904043c6309" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc7a9819a46e269520e441a6a4" ON "missions"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67f548aa362064431d00616903" ON "missions"  ("drone_id", "planned_start", "planned_end") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."maintenance_logs_type_enum" AS ENUM('ROUTINE_CHECK', 'BATTERY_REPLACEMENT', 'MOTOR_REPAIR', 'FIRMWARE_UPDATE', 'FULL_OVERHAUL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "maintenance_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "drone_id" uuid NOT NULL, "type" "public"."maintenance_logs_type_enum" NOT NULL, "technician_name" character varying(120) NOT NULL, "notes" character varying(1000), "performed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "flight_hours_at_maintenance" numeric(8,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_096e4b6bb7c9fe74d960e7523e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8ae4e0d6f420dc243db831ec3" ON "maintenance_logs"  ("drone_id", "performed_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD CONSTRAINT "FK_d3118ce623080aa9d3499577f6e" FOREIGN KEY ("drone_id") REFERENCES "drones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" ADD CONSTRAINT "FK_fba8bd6c2957f15780d933c3570" FOREIGN KEY ("drone_id") REFERENCES "drones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
        ALTER TABLE "missions"
        ADD CONSTRAINT "missions_no_overlap"
        EXCLUDE USING gist (
          drone_id WITH =,
          tstzrange(planned_start, planned_end) WITH &&
        )
        WHERE (status IN ('PLANNED', 'PRE_FLIGHT_CHECK', 'IN_PROGRESS'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "missions" DROP CONSTRAINT "missions_no_overlap"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" DROP CONSTRAINT "FK_fba8bd6c2957f15780d933c3570"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP CONSTRAINT "FK_d3118ce623080aa9d3499577f6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a8ae4e0d6f420dc243db831ec3"`,
    );
    await queryRunner.query(`DROP TABLE "maintenance_logs"`);
    await queryRunner.query(`DROP TYPE "public"."maintenance_logs_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_67f548aa362064431d00616903"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc7a9819a46e269520e441a6a4"`,
    );
    await queryRunner.query(`DROP TABLE "missions"`);
    await queryRunner.query(`DROP TYPE "public"."missions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."missions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0cc93fd277578b7f3aaf4d0d2a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e98f851ed2140771d18682f52d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c58fb0d50272dda6c64e7ee3ac"`,
    );
    await queryRunner.query(`DROP TABLE "drones"`);
    await queryRunner.query(`DROP TYPE "public"."drones_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."drones_model_enum"`);
  }
}
