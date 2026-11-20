/** Puerto de transacciones (SRP): los services no conocen DataSource ni QueryRunner. */
export interface TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export const TRANSACTION_RUNNER = Symbol('TRANSACTION_RUNNER');
