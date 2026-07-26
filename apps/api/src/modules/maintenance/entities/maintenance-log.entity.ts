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
import { MaintenanceType, MaintenanceStatus } from '@skyops/shared';
import { numericTransformer } from 'src/common/persistence/numeric.transformer';
import { Drone } from 'src/modules/drones/entities/drone.entity';

@Entity('maintenance_logs')
@Index(['droneId', 'completedAt'])
export class MaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'drone_id', type: 'uuid' })
  droneId!: string;

  @ManyToOne(() => Drone, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'drone_id' })
  drone!: Drone;

  @Column({ type: 'enum', enum: MaintenanceType })
  type!: MaintenanceType;

  @Column({ name: 'technician_name', type: 'varchar', length: 120 })
  technicianName!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.IN_PROGRESS,
  })
  status!: MaintenanceStatus;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({
    name: 'flight_hours_at_maintenance',
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: numericTransformer,
  })
  flightHoursAtMaintenance!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
