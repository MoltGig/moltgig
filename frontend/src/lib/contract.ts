import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther, decodeEventLog, type Log } from "viem";

// MoltGig Escrow V2 on Base Mainnet
export const ESCROW_ADDRESS = "0xf605936078F3d9670780a9582d53998a383f8020" as const;

export const ESCROW_ABI = [
  // Functions
  {
    name: "postTask",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "description", type: "string" },
      { name: "deadline", type: "uint256" }
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "claimTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "submitWork",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "taskId", type: "uint256" },
      { name: "deliverable", type: "string" }
    ],
    outputs: [],
  },
  {
    name: "approveWork",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "raiseDispute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "taskId", type: "uint256" },
      { name: "reason", type: "string" }
    ],
    outputs: [],
  },
  {
    name: "getTask",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "poster", type: "address" },
          { name: "worker", type: "address" },
          { name: "description", type: "string" },
          { name: "value", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "state", type: "uint8" },
          { name: "feeAmount", type: "uint256" },
          { name: "deliverable", type: "string" },
          { name: "posterApproved", type: "bool" },
          { name: "workerApproved", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "taskCounter",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Events
  {
    name: "TaskPosted",
    type: "event",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "poster", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    name: "TaskClaimed",
    type: "event",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "worker", type: "address", indexed: true },
    ],
  },
  {
    name: "TaskCompleted",
    type: "event",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "fee", type: "uint256", indexed: false },
      { name: "payment", type: "uint256", indexed: false },
    ],
  },
  {
    name: "TaskCancelled",
    type: "event",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "poster", type: "address", indexed: true },
      { name: "refund", type: "uint256", indexed: false },
    ],
  },
  {
    name: "DisputeRaised",
    type: "event",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "initiator", type: "address", indexed: true },
    ],
  },
] as const;

/**
 * Parse TaskPosted event from transaction logs to extract chain_task_id
 */
export function parseTaskPostedEvent(logs: Log[]): bigint | null {
  for (const log of logs) {
    try {
      if (log.address?.toLowerCase() === ESCROW_ADDRESS.toLowerCase()) {
        const decoded = decodeEventLog({
          abi: ESCROW_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "TaskPosted") {
          return (decoded.args as { taskId: bigint }).taskId;
        }
      }
    } catch {
      // Not our event, continue
    }
  }
  return null;
}

/**
 * Hook for posting a new task to the escrow contract
 * Returns chainTaskId after transaction is confirmed
 */
export function usePostTask() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const postTask = (rewardEth: string, description: string, deadline: bigint) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "postTask",
      args: [description, deadline],
      value: parseEther(rewardEth),
    });
  };

  // Extract chain_task_id from receipt logs
  const chainTaskId = receipt?.logs ? parseTaskPostedEvent(receipt.logs) : null;

  return {
    postTask,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    chainTaskId,
    reset,
  };
}

/**
 * Hook for claiming/accepting a task
 */
export function useClaimTask() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimTask = (chainTaskId: bigint) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "claimTask",
      args: [chainTaskId],
    });
  };

  return {
    claimTask,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Hook for submitting work on a task
 */
export function useSubmitWork() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitWork = (chainTaskId: bigint, deliverable: string) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "submitWork",
      args: [chainTaskId, deliverable],
    });
  };

  return {
    submitWork,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Hook for approving work and releasing payment
 * CRITICAL: This is what actually releases funds from escrow
 */
export function useApproveWork() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approveWork = (chainTaskId: bigint) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "approveWork",
      args: [chainTaskId],
    });
  };

  return {
    approveWork,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Hook for cancelling an unclaimed task and getting refund
 */
export function useCancelTask() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelTask = (chainTaskId: bigint) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "cancelTask",
      args: [chainTaskId],
    });
  };

  return {
    cancelTask,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Hook for raising a dispute on a task
 */
export function useRaiseDispute() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const raiseDispute = (chainTaskId: bigint, reason: string) => {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "raiseDispute",
      args: [chainTaskId, reason],
    });
  };

  return {
    raiseDispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Hook for reading task state from contract
 */
export function useContractTask(chainTaskId: bigint | null) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "getTask",
    args: chainTaskId ? [chainTaskId] : undefined,
    query: {
      enabled: chainTaskId !== null,
    },
  });

  return {
    task: data,
    isLoading,
    error,
    refetch,
  };
}

// Contract task states mapping
export const CONTRACT_STATES = {
  0: "Posted",
  1: "Claimed",
  2: "InProgress",
  3: "Completed",
  4: "Disputed",
  5: "Resolved",
  6: "Cancelled",
} as const;
