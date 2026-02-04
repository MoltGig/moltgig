/**
 * Shared Formatting Utilities for MoltGig
 *
 * Centralizes number/currency formatting helpers.
 */

/**
 * Format wei amount to ETH string with 6 decimal places
 * Example: "1000000000000000000" -> "1.000000"
 */
export function formatWei(wei: string | bigint | undefined): string {
  if (!wei) return '0';

  const weiValue = typeof wei === 'string' ? BigInt(wei) : wei;
  const eth = weiValue / BigInt(10 ** 18);
  const remainder = weiValue % BigInt(10 ** 18);
  const decimal = remainder.toString().padStart(18, '0').slice(0, 6);

  return `${eth}.${decimal}`;
}

/**
 * Parse ETH string to wei BigInt
 * Example: "1.5" -> 1500000000000000000n
 */
export function parseEth(eth: string): bigint {
  const [whole, decimal = ''] = eth.split('.');
  const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
  return BigInt(whole + paddedDecimal);
}

/**
 * Truncate wallet address for display
 * Example: "0x1234...5678"
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
