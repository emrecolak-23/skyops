import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MissionStatus, MissionType } from '@skyops/shared';
import { numericTransformer } from 'src/common/persistence/numeric.transformer';
import { Drone } from 'src/modules/drones/entities/drone.entity';

@Entity('missions')
@Index(['droneId', 'plannedStart', 'plannedEnd'])
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'enum', enum: MissionType })
  type!: MissionType;

  @Column({ name: 'drone_id', type: 'uuid' })
  droneId!: string;

  @ManyToOne(() => Drone, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'drone_id' })
  drone!: Drone;

  @Column({ name: 'pilot_name', type: 'varchar', length: 120 })
  pilotName!: string;

  @Column({ name: 'site_location', type: 'varchar', length: 200 })
  siteLocation!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: MissionStatus,
    default: MissionStatus.PLANNED,
  })
  status!: MissionStatus;

  @Column({ name: 'planned_start', type: 'timestamptz' })
  plannedStart!: Date;

  @Column({ name: 'planned_end', type: 'timestamptz' })
  plannedEnd!: Date;

  @Column({ name: 'actual_start', type: 'timestamptz', nullable: true })
  actualStart!: Date | null;

  @Column({ name: 'actual_end', type: 'timestamptz', nullable: true })
  actualEnd!: Date | null;

  @Column({
    name: 'flight_hours_logged',
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  flightHoursLogged!: number | null;

  @Column({
    name: 'abort_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  abortReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
