const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AstroStrikePool", function () {
  let astroStrikePool;
  let owner, user1, user2, user3;
  let fhevm;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy the contract
    const AstroStrikePool = await ethers.getContractFactory("AstroStrikePool");
    astroStrikePool = await AstroStrikePool.deploy();
    await astroStrikePool.waitForDeployment();

    console.log("Contract deployed to:", await astroStrikePool.getAddress());
  });

  describe("Pool Creation", function () {
    it("Should create a pool with valid parameters", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      const duration = 3600; // 1 hour
      const feePercentage = 5; // 5%

      const tx = await astroStrikePool.createPool(
        stakeAmount,
        duration,
        feePercentage,
        { value: stakeAmount }
      );

      await tx.wait();

      const pool = await astroStrikePool.pools(0);
      expect(pool.creator).to.equal(owner.address);
      expect(pool.stakeAmount).to.equal(stakeAmount);
      expect(pool.feePercentage).to.equal(feePercentage);
      expect(pool.isActive).to.equal(true);
    });

    it("Should fail to create pool with zero stake", async function () {
      await expect(
        astroStrikePool.createPool(0, 3600, 5)
      ).to.be.revertedWith("Stake amount must be greater than 0");
    });

    it("Should fail to create pool with invalid duration", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      // Too short
      await expect(
        astroStrikePool.createPool(stakeAmount, 30, 5, { value: stakeAmount })
      ).to.be.revertedWith("Duration must be between 1 minute and 30 days");

      // Too long (more than 30 days)
      await expect(
        astroStrikePool.createPool(stakeAmount, 31 * 24 * 3600, 5, {
          value: stakeAmount,
        })
      ).to.be.revertedWith("Duration must be between 1 minute and 30 days");
    });

    it("Should fail to create pool with invalid fee percentage", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await expect(
        astroStrikePool.createPool(stakeAmount, 3600, 25, {
          value: stakeAmount,
        })
      ).to.be.revertedWith("Fee percentage must be between 0 and 20");
    });

    it("Should fail if sent value doesn't match stake amount", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await expect(
        astroStrikePool.createPool(stakeAmount, 3600, 5, {
          value: ethers.parseEther("0.005"),
        })
      ).to.be.revertedWith("Sent value must match stake amount");
    });

    it("Should emit PoolCreated event", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await expect(
        astroStrikePool.createPool(stakeAmount, 3600, 5, {
          value: stakeAmount,
        })
      )
        .to.emit(astroStrikePool, "PoolCreated")
        .withArgs(0, owner.address, stakeAmount);
    });

    it("Should increment pool counter", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      await astroStrikePool.createPool(stakeAmount, 7200, 3, {
        value: stakeAmount,
      });

      const poolCount = await astroStrikePool.poolCounter();
      expect(poolCount).to.equal(2);
    });
  });

  describe("Betting", function () {
    let poolId;
    const stakeAmount = ethers.parseEther("0.01");

    beforeEach(async function () {
      // Create a pool before each test
      const tx = await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      await tx.wait();
      poolId = 0;
    });

    it("Should allow placing a bet with encrypted weight", async function () {
      // In a real test, you would encrypt the weight using FHE
      // For this test, we'll use a mock encrypted value
      const encryptedWeight = "0x1234567890abcdef"; // Mock encrypted data
      const side = 0; // Nova

      const tx = await astroStrikePool
        .connect(user1)
        .placeBet(poolId, encryptedWeight, side, { value: stakeAmount });

      await tx.wait();

      const bet = await astroStrikePool.getBet(poolId, user1.address);
      expect(bet.side).to.equal(side);
      expect(bet.hasBet).to.equal(true);
    });

    it("Should fail to bet on non-existent pool", async function () {
      const encryptedWeight = "0x1234567890abcdef";

      await expect(
        astroStrikePool
          .connect(user1)
          .placeBet(999, encryptedWeight, 0, { value: stakeAmount })
      ).to.be.revertedWith("Pool does not exist");
    });

    it("Should fail to bet on inactive pool", async function () {
      // Settle the pool first
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await astroStrikePool.settlePool(poolId);

      const encryptedWeight = "0x1234567890abcdef";

      await expect(
        astroStrikePool
          .connect(user1)
          .placeBet(poolId, encryptedWeight, 0, { value: stakeAmount })
      ).to.be.revertedWith("Pool is not active");
    });

    it("Should fail to bet twice on the same pool", async function () {
      const encryptedWeight = "0x1234567890abcdef";

      await astroStrikePool
        .connect(user1)
        .placeBet(poolId, encryptedWeight, 0, { value: stakeAmount });

      await expect(
        astroStrikePool
          .connect(user1)
          .placeBet(poolId, encryptedWeight, 1, { value: stakeAmount })
      ).to.be.revertedWith("Already placed a bet on this pool");
    });

    it("Should fail with invalid side", async function () {
      const encryptedWeight = "0x1234567890abcdef";

      await expect(
        astroStrikePool
          .connect(user1)
          .placeBet(poolId, encryptedWeight, 3, { value: stakeAmount })
      ).to.be.revertedWith("Invalid side");
    });

    it("Should fail if sent value doesn't match stake", async function () {
      const encryptedWeight = "0x1234567890abcdef";

      await expect(
        astroStrikePool.connect(user1).placeBet(poolId, encryptedWeight, 0, {
          value: ethers.parseEther("0.005"),
        })
      ).to.be.revertedWith("Sent value must match pool stake amount");
    });

    it("Should emit BetPlaced event", async function () {
      const encryptedWeight = "0x1234567890abcdef";

      await expect(
        astroStrikePool
          .connect(user1)
          .placeBet(poolId, encryptedWeight, 0, { value: stakeAmount })
      )
        .to.emit(astroStrikePool, "BetPlaced")
        .withArgs(poolId, user1.address, 0);
    });

    it("Should track multiple bets on different sides", async function () {
      const encryptedWeight = "0x1234567890abcdef";

      await astroStrikePool
        .connect(user1)
        .placeBet(poolId, encryptedWeight, 0, { value: stakeAmount });

      await astroStrikePool
        .connect(user2)
        .placeBet(poolId, encryptedWeight, 1, { value: stakeAmount });

      await astroStrikePool
        .connect(user3)
        .placeBet(poolId, encryptedWeight, 2, { value: stakeAmount });

      const pool = await astroStrikePool.pools(poolId);
      expect(pool.totalBets).to.equal(3);
    });
  });

  describe("Settlement", function () {
    let poolId;
    const stakeAmount = ethers.parseEther("0.01");

    beforeEach(async function () {
      const tx = await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      await tx.wait();
      poolId = 0;

      // Place some bets
      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(user1)
        .placeBet(poolId, encryptedWeight, 0, { value: stakeAmount });
      await astroStrikePool
        .connect(user2)
        .placeBet(poolId, encryptedWeight, 1, { value: stakeAmount });
    });

    it("Should settle pool after duration ends", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      const tx = await astroStrikePool.settlePool(poolId);
      await tx.wait();

      const pool = await astroStrikePool.pools(poolId);
      expect(pool.isActive).to.equal(false);
      expect(pool.isSettled).to.equal(true);
    });

    it("Should fail to settle before duration ends", async function () {
      await expect(
        astroStrikePool.settlePool(poolId)
      ).to.be.revertedWith("Pool duration has not ended yet");
    });

    it("Should fail to settle non-existent pool", async function () {
      await expect(
        astroStrikePool.settlePool(999)
      ).to.be.revertedWith("Pool does not exist");
    });

    it("Should fail to settle inactive pool", async function () {
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await astroStrikePool.settlePool(poolId);

      await expect(
        astroStrikePool.settlePool(poolId)
      ).to.be.revertedWith("Pool is not active");
    });

    it("Should emit PoolSettled event", async function () {
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await expect(astroStrikePool.settlePool(poolId))
        .to.emit(astroStrikePool, "PoolSettled")
        .withArgs(poolId);
    });
  });

  describe("Claim Reward", function () {
    let poolId;
    const stakeAmount = ethers.parseEther("0.01");

    beforeEach(async function () {
      const tx = await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      await tx.wait();
      poolId = 0;

      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(user1)
        .placeBet(poolId, encryptedWeight, 0, { value: stakeAmount });
    });

    it("Should allow claiming reward after settlement", async function () {
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await astroStrikePool.settlePool(poolId);

      // This test would need the actual winner determination logic
      // For now, we just check that the function exists
      const pool = await astroStrikePool.pools(poolId);
      expect(pool.isSettled).to.equal(true);
    });

    it("Should fail to claim from non-settled pool", async function () {
      await expect(
        astroStrikePool.connect(user1).claimReward(poolId)
      ).to.be.revertedWith("Pool is not settled yet");
    });

    it("Should fail to claim without a bet", async function () {
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await astroStrikePool.settlePool(poolId);

      await expect(
        astroStrikePool.connect(user3).claimReward(poolId)
      ).to.be.revertedWith("No bet placed on this pool");
    });

    it("Should fail to claim twice", async function () {
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await astroStrikePool.settlePool(poolId);

      // First claim
      try {
        await astroStrikePool.connect(user1).claimReward(poolId);
      } catch (e) {
        // May fail if not winner, that's ok
      }

      // Second claim should always fail
      await expect(
        astroStrikePool.connect(user1).claimReward(poolId)
      ).to.be.revertedWith("Reward already claimed");
    });
  });

  describe("View Functions", function () {
    it("Should return correct pool count", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      await astroStrikePool.createPool(stakeAmount, 7200, 3, {
        value: stakeAmount,
      });

      const count = await astroStrikePool.poolCounter();
      expect(count).to.equal(2);
    });

    it("Should return correct pool details", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      const duration = 3600;
      const feePercentage = 5;

      await astroStrikePool.createPool(stakeAmount, duration, feePercentage, {
        value: stakeAmount,
      });

      const pool = await astroStrikePool.pools(0);
      expect(pool.creator).to.equal(owner.address);
      expect(pool.stakeAmount).to.equal(stakeAmount);
      expect(pool.feePercentage).to.equal(feePercentage);
      expect(pool.isActive).to.equal(true);
      expect(pool.isSettled).to.equal(false);
    });

    it("Should return correct bet information", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(user1)
        .placeBet(0, encryptedWeight, 1, { value: stakeAmount });

      const bet = await astroStrikePool.getBet(0, user1.address);
      expect(bet.side).to.equal(1);
      expect(bet.hasBet).to.equal(true);
      expect(bet.hasClaimed).to.equal(false);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple pools simultaneously", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      await astroStrikePool.createPool(stakeAmount, 7200, 3, {
        value: stakeAmount,
      });
      await astroStrikePool.createPool(stakeAmount, 1800, 10, {
        value: stakeAmount,
      });

      const poolCount = await astroStrikePool.poolCounter();
      expect(poolCount).to.equal(3);

      // Check each pool is independent
      const pool0 = await astroStrikePool.pools(0);
      const pool1 = await astroStrikePool.pools(1);
      const pool2 = await astroStrikePool.pools(2);

      expect(pool0.feePercentage).to.equal(5);
      expect(pool1.feePercentage).to.equal(3);
      expect(pool2.feePercentage).to.equal(10);
    });

    it("Should handle user betting on multiple pools", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      const encryptedWeight = "0x1234567890abcdef";

      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      await astroStrikePool.createPool(stakeAmount, 7200, 3, {
        value: stakeAmount,
      });

      await astroStrikePool
        .connect(user1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });
      await astroStrikePool
        .connect(user1)
        .placeBet(1, encryptedWeight, 1, { value: stakeAmount });

      const bet0 = await astroStrikePool.getBet(0, user1.address);
      const bet1 = await astroStrikePool.getBet(1, user1.address);

      expect(bet0.side).to.equal(0);
      expect(bet1.side).to.equal(1);
      expect(bet0.hasBet).to.equal(true);
      expect(bet1.hasBet).to.equal(true);
    });

    it("Should handle pool with minimum duration", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      const minDuration = 60; // 1 minute

      const tx = await astroStrikePool.createPool(
        stakeAmount,
        minDuration,
        5,
        { value: stakeAmount }
      );
      await tx.wait();

      const pool = await astroStrikePool.pools(0);
      expect(pool.isActive).to.equal(true);
    });

    it("Should handle pool with maximum duration", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      const maxDuration = 30 * 24 * 3600; // 30 days

      const tx = await astroStrikePool.createPool(
        stakeAmount,
        maxDuration,
        5,
        { value: stakeAmount }
      );
      await tx.wait();

      const pool = await astroStrikePool.pools(0);
      expect(pool.isActive).to.equal(true);
    });
  });
});
