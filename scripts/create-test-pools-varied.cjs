const hre = require("hardhat");
const { parseEther } = require("ethers");

async function main() {
  console.log("\n🚀 Creating test prediction pools with varied durations...\n");

  const contractAddress = "0x7770E5F024a5c3781Cf986A9B5b46e1a199E1b4e";
  const contract = await hre.ethers.getContractAt("AstroStrikePool", contractAddress);

  const testPools = [
    {
      poolId: "QUICK-STRIKE-24H",
      entryFee: parseEther("0.001"),
      duration: 24 * 60 * 60, // 1 day
      name: "⚡ Quick Strike (24 Hours)",
    },
    {
      poolId: "WEEKLY-COSMIC-7D",
      entryFee: parseEther("0.0015"),
      duration: 7 * 24 * 60 * 60, // 7 days
      name: "🌟 Weekly Cosmic Challenge (7 Days)",
    },
    {
      poolId: "BIWEEKLY-NEBULA-15D",
      entryFee: parseEther("0.002"),
      duration: 15 * 24 * 60 * 60, // 15 days
      name: "💫 Bi-Weekly Nebula Cup (15 Days)",
    },
    {
      poolId: "MONTHLY-GALAXY-30D",
      entryFee: parseEther("0.003"),
      duration: 30 * 24 * 60 * 60, // 30 days
      name: "🌌 Monthly Galaxy Championship (30 Days)",
    },
    {
      poolId: "RAPID-FIRE-12H",
      entryFee: parseEther("0.0005"),
      duration: 12 * 60 * 60, // 12 hours
      name: "🔥 Rapid Fire (12 Hours)",
    },
  ];

  for (const pool of testPools) {
    try {
      console.log(`📝 Creating: ${pool.name}`);
      console.log(`   Pool ID: ${pool.poolId}`);
      console.log(`   Entry Fee: ${hre.ethers.formatEther(pool.entryFee)} ETH`);
      console.log(`   Duration: ${pool.duration / 3600} hours (${pool.duration / 86400} days)`);

      const tx = await contract.createReplicaPool(
        pool.poolId,
        pool.entryFee,
        pool.duration
      );

      console.log(`   ⏳ Waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`   ✅ Created! Tx: ${receipt.hash}\n`);
    } catch (error) {
      console.error(`   ❌ Failed to create ${pool.poolId}:`, error.message, "\n");
    }
  }

  console.log("✅ All pools created successfully!\n");
  console.log("📊 Summary:");
  console.log("   - 12 Hours: RAPID-FIRE-12H");
  console.log("   - 24 Hours: QUICK-STRIKE-24H");
  console.log("   - 7 Days: WEEKLY-COSMIC-7D");
  console.log("   - 15 Days: BIWEEKLY-NEBULA-15D");
  console.log("   - 30 Days: MONTHLY-GALAXY-30D");
  console.log("\n🌐 View on Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${contractAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
