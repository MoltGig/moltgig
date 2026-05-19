import { contractService, contractTaskStateToDbStatus } from './contract.js';

interface DbTaskRow {
  id: string;
  chain_task_id: number | string | null;
  status: string | null;
  reward_wei: string | number | null;
  requester_wallet?: string | null;
  worker_wallet?: string | null;
}

interface TransactionRow {
  task_id?: string | null;
  tx_type?: string | null;
  status?: string | null;
  amount_wei?: string | number | null;
  fee_wei?: string | number | null;
}

export interface ContractMismatch {
  chain_task_id: number;
  db_task_id: string | null;
  field: string;
  database_value: string | number | null;
  chain_value: string | number | null;
}

function normalizeAddress(address?: string | null): string | null {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return null;
  }
  return address.toLowerCase();
}

function hasConfirmedPaidTransaction(transactions: TransactionRow[], taskId: string): boolean {
  return transactions.some((tx) =>
    tx.task_id === taskId &&
    ['complete', 'dispute_resolve'].includes(tx.tx_type || '') &&
    ['confirmed', 'success'].includes(tx.status || '')
  );
}

export async function buildContractReconciliation(tasks: DbTaskRow[], transactions: TransactionRow[] = []) {
  const taskCounter = await contractService.getTaskCounter();
  const dbByChainId = new Map<number, DbTaskRow>();

  for (const task of tasks) {
    if (task.chain_task_id !== null && task.chain_task_id !== undefined) {
      dbByChainId.set(Number(task.chain_task_id), task);
    }
  }

  const mismatches: ContractMismatch[] = [];
  const missingInDatabase: number[] = [];
  const chainTasks = [];

  for (let chainTaskId = 1; chainTaskId <= taskCounter; chainTaskId += 1) {
    const chainTask = await contractService.getTask(chainTaskId);
    const dbTask = dbByChainId.get(chainTaskId) || null;
    const chainStatus = contractTaskStateToDbStatus(chainTask.state);

    chainTasks.push({
      chain_task_id: chainTaskId,
      state: chainTask.state,
      status: chainStatus,
      poster: normalizeAddress(chainTask.poster),
      worker: normalizeAddress(chainTask.worker),
      value: chainTask.value,
      has_database_task: Boolean(dbTask),
      db_task_id: dbTask?.id || null,
    });

    if (!dbTask) {
      missingInDatabase.push(chainTaskId);
      continue;
    }

    if (dbTask.status !== chainStatus) {
      mismatches.push({
        chain_task_id: chainTaskId,
        db_task_id: dbTask.id,
        field: 'status',
        database_value: dbTask.status,
        chain_value: chainStatus,
      });
    }

    if (String(dbTask.reward_wei || '0') !== chainTask.value) {
      mismatches.push({
        chain_task_id: chainTaskId,
        db_task_id: dbTask.id,
        field: 'reward_wei',
        database_value: String(dbTask.reward_wei || '0'),
        chain_value: chainTask.value,
      });
    }

    const requesterWallet = normalizeAddress(dbTask.requester_wallet);
    const chainPoster = normalizeAddress(chainTask.poster);
    if (requesterWallet && chainPoster && requesterWallet !== chainPoster) {
      mismatches.push({
        chain_task_id: chainTaskId,
        db_task_id: dbTask.id,
        field: 'requester_wallet',
        database_value: requesterWallet,
        chain_value: chainPoster,
      });
    }

    const workerWallet = normalizeAddress(dbTask.worker_wallet);
    const chainWorker = normalizeAddress(chainTask.worker);
    if (workerWallet !== chainWorker) {
      mismatches.push({
        chain_task_id: chainTaskId,
        db_task_id: dbTask.id,
        field: 'worker_wallet',
        database_value: workerWallet,
        chain_value: chainWorker,
      });
    }

    if (chainStatus === 'completed' && !hasConfirmedPaidTransaction(transactions, dbTask.id)) {
      mismatches.push({
        chain_task_id: chainTaskId,
        db_task_id: dbTask.id,
        field: 'payment_transaction',
        database_value: null,
        chain_value: 'completed',
      });
    }
  }

  const databaseChainIds = new Set(dbByChainId.keys());
  const missingOnChain = Array.from(databaseChainIds)
    .filter((chainTaskId) => chainTaskId > taskCounter || chainTaskId < 1)
    .sort((a, b) => a - b);

  return {
    generated_at: new Date().toISOString(),
    contract: {
      task_counter: taskCounter,
    },
    database: {
      tasks_with_chain_id: dbByChainId.size,
    },
    summary: {
      missing_in_database: missingInDatabase.length,
      missing_on_chain: missingOnChain.length,
      mismatches: mismatches.length,
    },
    missing_in_database: missingInDatabase,
    missing_on_chain: missingOnChain,
    mismatches,
    chain_tasks: chainTasks,
  };
}
