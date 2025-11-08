const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying AstroStrikePool...");

  // Deploy the contract
  const AstroStrikePool = await hre.ethers.getContractFactory("AstroStrikePool");
  const pool = await AstroStrikePool.deploy();

  await pool.waitForDeployment();

  const poolAddress = await pool.getAddress();

  console.log("✅ AstroStrikePool deployed to:", poolAddress);

  // Get contract constants
  const minEntryFee = await pool.MIN_ENTRY_FEE();
  const minDuration = await pool.MIN_DURATION();
  const maxDuration = await pool.MAX_DURATION();

  console.log("\n📋 Contract Constants:");
  console.log("  MIN_ENTRY_FEE:", hre.ethers.formatEther(minEntryFee), "ETH");
  console.log("  MIN_DURATION:", minDuration.toString(), "seconds");
  console.log("  MAX_DURATION:", maxDuration.toString(), "seconds");

  console.log("\n📝 Next steps:");
  console.log(`  1. Update ASTRO_STRIKE_POOL_ADDRESS in frontend/src/constants/contracts.ts to: ${poolAddress}`);
  console.log("  2. Run: cd frontend && npm install && npm run dev");
  console.log("  3. Connect your wallet to Sepolia testnet");
  console.log("  4. Create a pool and test the FHE encryption!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
