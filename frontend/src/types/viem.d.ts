declare module 'viem' {
  export function parseEther(value: string): bigint;
  export function formatEther(value: bigint): string;
  export function decodeEventLog(params: {
    abi: readonly unknown[];
    data: string;
    topics: readonly string[];
  }): { eventName: string; args: Record<string, unknown> };
  export type Log = {
    address: string;
    blockHash: string;
    blockNumber: bigint;
    data: string;
    logIndex: number;
    removed: boolean;
    topics: readonly string[];
    transactionHash: string;
    transactionIndex: number;
  };
}

declare module 'viem/chains' {
  interface Chain {
    id: number;
    name: string;
    network: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: {
      default: { http: readonly string[] };
      public?: { http: readonly string[] };
    };
    blockExplorers?: {
      default: { name: string; url: string };
    };
  }
  export const base: Chain;
  export const baseSepolia: Chain;
  export const mainnet: Chain;
}
