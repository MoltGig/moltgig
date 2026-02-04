import { formatEther, parseEther } from "viem";

// Default ETH price fallback (used when context not available)
export const DEFAULT_ETH_PRICE = 3000;

export function formatWei(wei: string | bigint): string {
  const eth = formatEther(BigInt(wei));
  const num = parseFloat(eth);
  if (num === 0) return "0 ETH";
  if (num < 0.0001) return "<0.0001 ETH";
  return `${num.toFixed(4)} ETH`;
}

export function formatWeiWithUsd(
  wei: string | bigint,
  ethPrice: number = DEFAULT_ETH_PRICE
): { eth: string; usd: string; usdValue: number } {
  const eth = formatEther(BigInt(wei));
  const num = parseFloat(eth);
  const usdValue = num * ethPrice;

  let ethStr: string;
  if (num === 0) ethStr = "0 ETH";
  else if (num < 0.0001) ethStr = "<0.0001 ETH";
  else ethStr = `${num.toFixed(6)} ETH`;

  let usdStr: string;
  if (usdValue < 0.01) usdStr = "<$0.01";
  else if (usdValue < 1) usdStr = `$${usdValue.toFixed(2)}`;
  else usdStr = `$${usdValue.toFixed(2)}`;

  return { eth: ethStr, usd: usdStr, usdValue };
}

export function parseWei(eth: string): string {
  return parseEther(eth).toString();
}

export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatDeadline(date: string | Date): string {
  const now = new Date();
  const deadline = new Date(date);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs < 0) return "Expired";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 1) return `${diffDays} days left`;
  if (diffDays === 1) return "1 day left";
  if (diffHours > 1) return `${diffHours} hours left`;
  if (diffHours === 1) return "1 hour left";
  if (diffMins > 1) return `${diffMins} mins left`;
  return "< 1 min left";
}

export function detectPlatform(title: string): "linkedin" | "twitter" | "farcaster" | null {
  const lower = title.toLowerCase();
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("twitter") || lower.includes("x/twitter") || lower.includes("x ")) return "twitter";
  if (lower.includes("farcaster") || lower.includes("warpcast")) return "farcaster";
  return null;
}

export function isPremiumTask(wei: string | bigint, ethPrice: number = DEFAULT_ETH_PRICE): boolean {
  const { usdValue } = formatWeiWithUsd(wei, ethPrice);
  return usdValue >= 0.40;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "bg-success",
    funded: "bg-primary",
    accepted: "bg-primary-light",
    submitted: "bg-purple-500",
    completed: "bg-green-600",
    disputed: "bg-error",
    cancelled: "bg-muted",
  };
  return colors[status] || "bg-muted";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Open",
    funded: "Funded",
    accepted: "In Progress",
    submitted: "Submitted",
    completed: "Completed",
    disputed: "Disputed",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

// Known wallet addresses for display names
const KNOWN_WALLETS: Record<string, string> = {
  "0x7a23f8bc1d9e4a5c6b8d2e3f4a5b6c7d8e9f0a1b": "TaskMaster_AI",
  "0x8b34c9de2e0f5b6d7c9e3f4a5b6c7d8e9f0a1b2c": "GigHunter",
  "0x9c45d0ef3f1a6c7e8d0f4a5b6c7d8e9f0a1b2c3d": "WorkFlow_Bot",
  "0xad56e1f0402b7d8f9e1a5b6c7d8e9f0a1b2c3d4e": "PromoAgent",
  "0xbe67f2a1513c8e9a0f2b6c7d8e9f0a1b2c3d4e5f": "ContentCraft",
  "0xcf78a3b2624d9f0b1a3c7d8e9f0a1b2c3d4e5f6a": "SocialSync",
  "0xd089b4c3735e0a1c2b4d8e9f0a1b2c3d4e5f6a7b": "MarketMolt",
  "0xe19ac5d4846f1b2d3c5e9f0a1b2c3d4e5f6a7b8c": "ViralVector",
  "0xf2abd6e5957a2c3e4d6f0a1b2c3d4e5f6a7b8c9d": "BuzzBuilder",
  "0xa3bce7f6068b3d4f5e7a1b2c3d4e5f6a7b8c9d0e": "ReachBot",
  "0x2e4ccd9d1e14764575c99224684e4020d2eabd81": "MoltGig Operations",
  "0x491cfd950cd82bb3878860392a8e807d3a41d434": "GigBot",
  "0xa1caa2416a6d703347dc24b5fea5a823ae171b3e": "DataMolt",
  "0x946feefffe5da1686dc762ca85cc54f9ab934bd60": "CodeClaw",
};

export function getWalletDisplayName(address: string): string | null {
  return KNOWN_WALLETS[address.toLowerCase()] || null;
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
