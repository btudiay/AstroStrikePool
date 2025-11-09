const hre = require("hardhat");
const { parseEther } = require("ethers");

async function main() {
  const contractAddress = "0xbb7dfFe61afEde21F86Af497aB05811c0cECAa05";

  console.log("\n🎰 Creating test prediction pools...\n");

  const contract = await hre.ethers.getContractAt("AstroStrikePool", contractAddress);

  // Test pools configuration
  const testPools = [
    {
      poolId: "COSMIC-STRIKE-001",
      entryFee: parseEther("0.001"),
      duration: 24 * 60 * 60, // 24 hours
      name: "🌟 Galactic Championship"
    },
    {
      poolId: "NEBULA-CLASH-002",
      entryFee: parseEther("0.0015"),
      duration: 12 * 60 * 60, // 12 hours
      name: "💫 Nebula Showdown"
    },
    {
      poolId: "STELLAR-DUEL-003",
      entryFee: parseEther("0.002"),
      duration: 6 * 60 * 60, // 6 hours
      name: "⚡ Stellar Lightning Round"
    },
    {
      poolId: "COSMIC-FINALE-004",
      entryFee: parseEther("0.0025"),
      duration: 48 * 60 * 60, // 48 hours
      name: "🔥 Cosmic Finale"
    },
    {
      poolId: "QUANTUM-QUICK-005",
      entryFee: parseEther("0.0005"),
      duration: 2 * 60 * 60, // 2 hours
      name: "✨ Quantum Quick Match"
    }
  ];

  for (const pool of testPools) {
    try {
      console.log(`Creating: ${pool.name}`);
      console.log(`  Pool ID: ${pool.poolId}`);
      console.log(`  Entry Fee: ${hre.ethers.formatEther(pool.entryFee)} ETH`);
      console.log(`  Duration: ${pool.duration / 3600} hours`);

      const tx = await contract.createReplicaPool(
        pool.poolId,
        pool.entryFee,
        pool.duration
      );

      await tx.wait();
      console.log(`  ✅ Created! Tx: ${tx.hash}\n`);
    } catch (error) {
      console.error(`  ❌ Error creating ${pool.poolId}:`, error.message, "\n");
    }
  }

  console.log("\n🎉 Test pools creation complete!\n");
  console.log("📋 Pool IDs created:");
  testPools.forEach((pool, idx) => {
    console.log(`  ${idx + 1}. ${pool.poolId} - ${pool.name}`);
  });
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
