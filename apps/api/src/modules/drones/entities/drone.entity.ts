import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DroneModel, DroneStatus } from '@skyops/shared';
import { numericTransformer } from 'src/common/persistence/numeric.transformer';

@Entity('drones')
export class Drone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'serial_number', type: 'varchar', length: 20, unique: true })
  serialNumber!: string;

  @Column({ type: 'enum', enum: DroneModel })
  model!: DroneModel;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes!: string | null;

  @Index()
  @Column({ type: 'enum', enum: DroneStatus, default: DroneStatus.AVAILABLE })
  status!: DroneStatus;

  @Column({
    name: 'total_flight_hours',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  totalFlightHours!: number;

  @Column({
    name: 'last_maintenance_date',
    type: 'timestamptz',
    nullable: true,
  })
  lastMaintenanceDate!: Date | null;

  @Index()
  @Column({
    name: 'next_maintenance_due_date',
    type: 'timestamptz',
    nullable: true,
  })
  nextMaintenanceDueDate!: Date | null;

  @Column({
    name: 'flight_hours_at_last_maintenance',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  flightHoursAtLastMaintenance!: number;

  @CreateDateColumn({ name: 'registered_at', type: 'timestamptz' })
  registeredAt!: Date;
}
