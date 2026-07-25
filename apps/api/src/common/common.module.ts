import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CLOCK } from './clock/clock.token';
import { SystemClock } from './clock/clock';
import {
  TRANSACTION_RUNNER,
  TransactionRunner,
} from './persistence/transaction-runner';
import { Tx } from './persistence/tx';

@Global()
@Module({
  providers: [
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    {
      provide: TRANSACTION_RUNNER,
      inject: [DataSource],
      useFactory: (dataSource: DataSource): TransactionRunner => ({
        run: <T>(fn: (tx?: Tx) => Promise<T>) => dataSource.transaction(fn),
      }),
    },
  ],
  exports: [CLOCK, TRANSACTION_RUNNER],
})
export class CommonModule {}
