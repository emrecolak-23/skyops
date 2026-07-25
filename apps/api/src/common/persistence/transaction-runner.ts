import { Tx } from './tx';

export const TRANSACTION_RUNNER = Symbol('TRANSACTION_RUNNER');

export interface TransactionRunner {
  run<T>(fn: (tx?: Tx) => Promise<T>): Promise<T>;
}
