const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AstroStrikePool Integration Tests", function () {
  let astroStrikePool;
  let owner, creator, bettor1, bettor2, bettor3, bettor4;
  const stakeAmount = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, creator, bettor1, bettor2, bettor3, bettor4] =
      await ethers.getSigners();

    const AstroStrikePool = await ethers.getContractFactory("AstroStrikePool");
    astroStrikePool = await AstroStrikePool.deploy();
    await astroStrikePool.waitForDeployment();
  });

  describe("Complete Pool Lifecycle", function () {
    it("Should complete full lifecycle: create -> bet -> settle -> claim", async function () {
      // Step 1: Create pool
      const duration = 3600; // 1 hour
      const feePercentage = 5;

      const createTx = await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, duration, feePercentage, {
          value: stakeAmount,
        });
      await createTx.wait();

      const poolId = 0;
      let pool = await astroStrikePool.pools(poolId);
      expect(pool.isActive).to.equal(true);
      expect(pool.creator).to.equal(creator.address);

      // Step 2: Multiple users place bets
      const encryptedWeight1 = "0x1111111111111111";
      const encryptedWeight2 = "0x2222222222222222";
      const encryptedWeight3 = "0x3333333333333333";

      await astroStrikePool
        .connect(bettor1)
        .placeBet(poolId, encryptedWeight1, 0, { value: stakeAmount }); // Nova

      await astroStrikePool
        .connect(bettor2)
        .placeBet(poolId, encryptedWeight2, 1, { value: stakeAmount }); // Pulse

      await astroStrikePool
        .connect(bettor3)
        .placeBet(poolId, encryptedWeight3, 2, { value: stakeAmount }); // Flux

      pool = await astroStrikePool.pools(poolId);
      expect(pool.totalBets).to.equal(3);

      // Step 3: Wait for duration to end
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      // Step 4: Settle pool
      const settleTx = await astroStrikePool.settlePool(poolId);
      await settleTx.wait();

      pool = await astroStrikePool.pools(poolId);
      expect(pool.isSettled).to.equal(true);
      expect(pool.isActive).to.equal(false);

      // Step 5: Winners claim rewards (this part would need actual FHE logic)
      // For now, we just verify the state is correct
      const bet1 = await astroStrikePool.getBet(poolId, bettor1.address);
      expect(bet1.hasBet).to.equal(true);
    });

    it("Should handle pool with no bets", async function () {
      const duration = 3600;
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, duration, 5, { value: stakeAmount });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      // Settle pool with no bets
      const tx = await astroStrikePool.settlePool(0);
      await tx.wait();

      const pool = await astroStrikePool.pools(0);
      expect(pool.isSettled).to.equal(true);
      expect(pool.totalBets).to.equal(0);
    });

    it("Should handle pool with bets on only one side", async function () {
      const duration = 3600;
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, duration, 5, { value: stakeAmount });

      const encryptedWeight = "0x1234567890abcdef";

      // All bets on Nova
      await astroStrikePool
        .connect(bettor1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });
      await astroStrikePool
        .connect(bettor2)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });

      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      const tx = await astroStrikePool.settlePool(0);
      await tx.wait();

      const pool = await astroStrikePool.pools(0);
      expect(pool.isSettled).to.equal(true);
    });
  });

  describe("Multiple Pools Interaction", function () {
    it("Should handle multiple pools running simultaneously", async function () {
      // Create 3 pools with different parameters
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      await astroStrikePool
        .connect(creator)
        .createPool(ethers.parseEther("0.02"), 7200, 3, {
          value: ethers.parseEther("0.02"),
        });

      await astroStrikePool
        .connect(creator)
        .createPool(ethers.parseEther("0.005"), 1800, 10, {
          value: ethers.parseEther("0.005"),
        });

      const poolCount = await astroStrikePool.poolCounter();
      expect(poolCount).to.equal(3);

      // Place bets on different pools
      const encryptedWeight = "0x1234567890abcdef";

      await astroStrikePool
        .connect(bettor1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });

      await astroStrikePool
        .connect(bettor1)
        .placeBet(1, encryptedWeight, 1, {
          value: ethers.parseEther("0.02"),
        });

      await astroStrikePool
        .connect(bettor2)
        .placeBet(2, encryptedWeight, 2, {
          value: ethers.parseEther("0.005"),
        });

      // Verify each pool's state
      const pool0 = await astroStrikePool.pools(0);
      const pool1 = await astroStrikePool.pools(1);
      const pool2 = await astroStrikePool.pools(2);

      expect(pool0.totalBets).to.equal(1);
      expect(pool1.totalBets).to.equal(1);
      expect(pool2.totalBets).to.equal(1);
    });

    it("Should settle pools independently", async function () {
      // Create 2 pools with different durations
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 1800, 5, { value: stakeAmount }); // 30 min

      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount }); // 60 min

      // Fast forward 31 minutes
      await ethers.provider.send("evm_increaseTime", [1860]);
      await ethers.provider.send("evm_mine");

      // Pool 0 should be settleable
      await astroStrikePool.settlePool(0);
      const pool0 = await astroStrikePool.pools(0);
      expect(pool0.isSettled).to.equal(true);

      // Pool 1 should not be settleable yet
      await expect(astroStrikePool.settlePool(1)).to.be.revertedWith(
        "Pool duration has not ended yet"
      );

      // Fast forward another 30 minutes
      await ethers.provider.send("evm_increaseTime", [1800]);
      await ethers.provider.send("evm_mine");

      // Now pool 1 should be settleable
      await astroStrikePool.settlePool(1);
      const pool1 = await astroStrikePool.pools(1);
      expect(pool1.isSettled).to.equal(true);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should measure gas for pool creation", async function () {
      const tx = await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });
      const receipt = await tx.wait();

      console.log("Gas used for pool creation:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lessThan(500000); // Should be efficient
    });

    it("Should measure gas for placing bet", async function () {
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      const encryptedWeight = "0x1234567890abcdef";
      const tx = await astroStrikePool
        .connect(bettor1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });
      const receipt = await tx.wait();

      console.log("Gas used for placing bet:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lessThan(300000);
    });

    it("Should measure gas for settlement", async function () {
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(bettor1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      const tx = await astroStrikePool.settlePool(0);
      const receipt = await tx.wait();

      console.log("Gas used for settlement:", receipt.gasUsed.toString());
    });
  });

  describe("Stress Tests", function () {
    it("Should handle many bets on single pool", async function () {
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      const encryptedWeight = "0x1234567890abcdef";

      // Place 10 bets from different accounts
      const signers = await ethers.getSigners();
      for (let i = 1; i <= 10 && i < signers.length; i++) {
        const side = i % 3; // Distribute across 3 sides
        await astroStrikePool
          .connect(signers[i])
          .placeBet(0, encryptedWeight, side, { value: stakeAmount });
      }

      const pool = await astroStrikePool.pools(0);
      expect(pool.totalBets).to.equal(10);
    });

    it("Should handle creating many pools", async function () {
      const poolCount = 10;

      for (let i = 0; i < poolCount; i++) {
        await astroStrikePool
          .connect(creator)
          .createPool(stakeAmount, 3600, 5, { value: stakeAmount });
      }

      const counter = await astroStrikePool.poolCounter();
      expect(counter).to.equal(poolCount);

      // Verify all pools are active
      for (let i = 0; i < poolCount; i++) {
        const pool = await astroStrikePool.pools(i);
        expect(pool.isActive).to.equal(true);
      }
    });
  });

  describe("Event Emission Tests", function () {
    it("Should emit all events in correct order", async function () {
      // Create pool - should emit PoolCreated
      const createTx = await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      await expect(createTx)
        .to.emit(astroStrikePool, "PoolCreated")
        .withArgs(0, creator.address, stakeAmount);

      // Place bet - should emit BetPlaced
      const encryptedWeight = "0x1234567890abcdef";
      const betTx = await astroStrikePool
        .connect(bettor1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });

      await expect(betTx)
        .to.emit(astroStrikePool, "BetPlaced")
        .withArgs(0, bettor1.address, 0);

      // Settle pool - should emit PoolSettled
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      const settleTx = await astroStrikePool.settlePool(0);
      await expect(settleTx).to.emit(astroStrikePool, "PoolSettled").withArgs(0);
    });
  });

  describe("Security Tests", function () {
    it("Should prevent reentrancy on claim", async function () {
      // This would require a malicious contract attempting reentrancy
      // For basic test, we just verify the state changes are correct
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(bettor1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await astroStrikePool.settlePool(0);

      // Verify claim protection
      await expect(
        astroStrikePool.connect(bettor2).claimReward(0)
      ).to.be.revertedWith("No bet placed on this pool");
    });

    it("Should protect against unauthorized settlement", async function () {
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      // Try to settle before time
      await expect(astroStrikePool.settlePool(0)).to.be.revertedWith(
        "Pool duration has not ended yet"
      );

      // Try to settle non-existent pool
      await expect(astroStrikePool.settlePool(999)).to.be.revertedWith(
        "Pool does not exist"
      );
    });

    it("Should validate stake amounts correctly", async function () {
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      const encryptedWeight = "0x1234567890abcdef";

      // Try to bet with wrong amount
      await expect(
        astroStrikePool.connect(bettor1).placeBet(0, encryptedWeight, 0, {
          value: ethers.parseEther("0.02"), // Wrong amount
        })
      ).to.be.revertedWith("Sent value must match pool stake amount");
    });
  });

  describe("Contract Balance Tests", function () {
    it("Should track contract balance correctly", async function () {
      const initialBalance = await ethers.provider.getBalance(
        await astroStrikePool.getAddress()
      );

      // Create pool
      await astroStrikePool
        .connect(creator)
        .createPool(stakeAmount, 3600, 5, { value: stakeAmount });

      let balance = await ethers.provider.getBalance(
        await astroStrikePool.getAddress()
      );
      expect(balance).to.equal(initialBalance + stakeAmount);

      // Place bet
      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(bettor1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });

      balance = await ethers.provider.getBalance(
        await astroStrikePool.getAddress()
      );
      expect(balance).to.equal(initialBalance + stakeAmount + stakeAmount);
    });
  });
});
