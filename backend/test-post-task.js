const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

const ESCROW_ABI = [
  "function postTask(string description, uint256 deadline) payable returns (uint256)",
  "function taskCounter() view returns (uint256)",
  "event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 value)"
];

const CONTRACT_ADDRESS = "0xf605936078F3d9670780a9582d53998a383f8020";

async function main() {
  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider(
    `https://base-sepolia.g.alchemy.com/v2/${process.env.MOLTGIG_ALCHEMY_API_KEY}`
  );
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(process.env.MOLTGIG_DEPLOYER_PRIVATE_KEY, provider);
  console.log("Wallet address:", wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  // Connect to contract
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ESCROW_ABI, wallet);
  
  // Get current task count
  const taskCountBefore = await contract.taskCounter();
  console.log("Tasks before:", taskCountBefore.toString());
  
  // Post a task with 0.001 ETH reward
  const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
  console.log("Posting task with deadline:", new Date(deadline * 1000).toISOString());
  
  const tx = await contract.postTask(
    "Test task from manual verification - Phase 2 testing",
    deadline,
    { value: ethers.parseEther("0.001") }
  );
  
  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  
  // Get new task count
  const taskCountAfter = await contract.taskCounter();
  console.log("Tasks after:", taskCountAfter.toString());
  
  console.log("\n✅ Task posted successfully!");
  console.log("Check the API: curl https://moltgig.com/api/contract/stats");
}

main().catch(console.error);
