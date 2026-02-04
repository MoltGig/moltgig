import { Request, Response, NextFunction } from 'express';
import { verifyMessage, hashMessage, ethers } from 'ethers';
import supabase from '../config/supabase.js';
import type { Agent, AuthenticatedRequest } from '../types/index.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request extends AuthenticatedRequest {}
  }
}

// EIP-1271 magic value for valid signatures
const EIP1271_MAGIC_VALUE = '0x1626ba7e';

// EIP-1271 ABI for isValidSignature
const EIP1271_ABI = [
  'function isValidSignature(bytes32 hash, bytes signature) external view returns (bytes4)'
];

// Get provider for on-chain verification
function getProvider() {
  const rpcUrl = process.env.BASE_RPC_URL || 
    `https://base-mainnet.g.alchemy.com/v2/${process.env.MOLTGIG_ALCHEMY_API_KEY}`;
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Verify signature using EIP-1271 (smart contract wallets)
 * Calls isValidSignature on the contract to verify
 */
async function verifyEIP1271Signature(
  contractAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const provider = getProvider();
    
    // Check if address is a contract
    const code = await provider.getCode(contractAddress);
    if (code === '0x' || code === '0x0') {
      return false; // Not a contract
    }
    
    // Hash the message (EIP-191 personal sign format)
    const messageHash = hashMessage(message);
    
    // Call isValidSignature on the contract
    const contract = new ethers.Contract(contractAddress, EIP1271_ABI, provider);
    
    try {
      const result = await contract.isValidSignature(messageHash, signature);
      return result === EIP1271_MAGIC_VALUE;
    } catch {
      // Contract might not implement EIP-1271
      return false;
    }
  } catch (err) {
    console.error('EIP-1271 verification error:', err);
    return false;
  }
}

/**
 * Verify signature - supports both EOA and smart contract wallets (EIP-1271)
 */
async function verifySignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  // First, try standard EOA verification
  try {
    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() === walletAddress.toLowerCase()) {
      return true;
    }
  } catch {
    // EOA verification failed, will try EIP-1271
  }
  
  // Try EIP-1271 verification for smart contract wallets
  const isValidSmartWallet = await verifyEIP1271Signature(
    walletAddress,
    message,
    signature
  );
  
  return isValidSmartWallet;
}

/**
 * Wallet signature authentication middleware
 * 
 * Supports both:
 * - EOA wallets (MetaMask, Rainbow, etc.)
 * - Smart contract wallets (Coinbase Smart Wallet, Safe, etc.) via EIP-1271
 * 
 * Expects headers:
 * - x-wallet-address: The wallet address claiming to sign
 * - x-signature: The signature of a message containing timestamp
 * - x-timestamp: Unix timestamp (must be within 5 minutes)
 * 
 * Message format: "MoltGig Auth: {timestamp}"
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const walletAddress = req.headers['x-wallet-address'] as string;
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;

    if (!walletAddress || !signature || !timestamp) {
      res.status(401).json({ 
        error: 'Missing authentication headers',
        required: ['x-wallet-address', 'x-signature', 'x-timestamp']
      });
      return;
    }

    // Verify timestamp is within 5 minutes
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      res.status(401).json({ error: 'Timestamp expired or invalid' });
      return;
    }

    // Verify signature (supports EOA and EIP-1271 smart wallets)
    const message = `MoltGig Auth: ${timestamp}`;
    const isValid = await verifySignature(walletAddress, message, signature);
    
    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Get or create agent
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Database error:', error);
      res.status(500).json({ error: 'Database error' });
      return;
    }

    req.wallet_address = walletAddress.toLowerCase();
    req.agent = agent as Agent | undefined;

    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth - sets wallet_address if valid, but doesn't require it
 * Supports both EOA and smart contract wallets
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const walletAddress = req.headers['x-wallet-address'] as string;
  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  if (walletAddress && signature && timestamp) {
    try {
      const timestampNum = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      
      if (Math.abs(now - timestampNum) <= 300) {
        const message = `MoltGig Auth: ${timestamp}`;
        const isValid = await verifySignature(walletAddress, message, signature);
        
        if (isValid) {
          req.wallet_address = walletAddress.toLowerCase();
          
          const { data: agent } = await supabase
            .from('agents')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();
          
          req.agent = agent as Agent | undefined;
        }
      }
    } catch {
      // Silently ignore auth errors for optional auth
    }
  }
  
  next();
}
