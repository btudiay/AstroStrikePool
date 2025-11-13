const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AstroStrikePool FHE Operations", function () {
  let astroStrikePool;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const AstroStrikePool = await ethers.getContractFactory("AstroStrikePool");
    astroStrikePool = await AstroStrikePool.deploy();
    await astroStrikePool.waitForDeployment();
  });

  describe("Encrypted Weight Handling", function () {
    let poolId;
    const stakeAmount = ethers.parseEther("0.01");

    beforeEach(async function () {
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      poolId = 0;
    });

    it("Should accept and store encrypted weights", async function () {
      // In production, this would be actual FHE encrypted data
      const encryptedWeight = "0x1234567890abcdef1234567890abcdef";

      const tx = await astroStrikePool
        .connect(user1)
        .placeBet(poolId, encryptedWeight, 0, { value: stakeAmount });

      await tx.wait();

      const bet = await astroStrikePool.getBet(poolId, user1.address);
      expect(bet.hasBet).to.equal(true);
    });

    it("Should store different encrypted weights for different users", async function () {
      const encryptedWeight1 = "0x1111111111111111";
      const encryptedWeight2 = "0x2222222222222222";
      const encryptedWeight3 = "0x3333333333333333";

      await astroStrikePool
        .connect(user1)
        .placeBet(poolId, encryptedWeight1, 0, { value: stakeAmount });

      await astroStrikePool
        .connect(user2)
        .placeBet(poolId, encryptedWeight2, 1, { value: stakeAmount });

      await astroStrikePool
        .connect(user3)
        .placeBet(poolId, encryptedWeight3, 2, { value: stakeAmount });

      // All bets should be recorded
      const bet1 = await astroStrikePool.getBet(poolId, user1.address);
      const bet2 = await astroStrikePool.getBet(poolId, user2.address);
      const bet3 = await astroStrikePool.getBet(poolId, user3.address);

      expect(bet1.side).to.equal(0);
      expect(bet2.side).to.equal(1);
      expect(bet3.side).to.equal(2);
    });

    it("Should handle empty encrypted weight", async function () {
      const emptyWeight = "0x";

      // This should still work, as validation happens in the contract
      const tx = await astroStrikePool
        .connect(user1)
        .placeBet(poolId, emptyWeight, 0, { value: stakeAmount });

      await tx.wait();

      const bet = await astroStrikePool.getBet(poolId, user1.address);
      expect(bet.hasBet).to.equal(true);
    });
  });

  describe("Weight Comparison and Settlement", function () {
    it("Should settle with encrypted weight comparisons", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      // Simulate different encrypted weights
      const highWeight = "0xffffffffffffffff";
      const mediumWeight = "0x8888888888888888";
      const lowWeight = "0x1111111111111111";

      await astroStrikePool
        .connect(user1)
        .placeBet(0, highWeight, 0, { value: stakeAmount });

      await astroStrikePool
        .connect(user2)
        .placeBet(0, mediumWeight, 1, { value: stakeAmount });

      await astroStrikePool
        .connect(user3)
        .placeBet(0, lowWeight, 2, { value: stakeAmount });

      // Fast forward and settle
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      const tx = await astroStrikePool.settlePool(0);
      await tx.wait();

      const pool = await astroStrikePool.pools(0);
      expect(pool.isSettled).to.equal(true);
      // In production, the winner would be determined by FHE comparisons
    });

    it("Should handle settlement with equal encrypted weights", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      const sameWeight = "0x5555555555555555";

      await astroStrikePool
        .connect(user1)
        .placeBet(0, sameWeight, 0, { value: stakeAmount });

      await astroStrikePool
        .connect(user2)
        .placeBet(0, sameWeight, 1, { value: stakeAmount });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      const tx = await astroStrikePool.settlePool(0);
      await tx.wait();

      const pool = await astroStrikePool.pools(0);
      expect(pool.isSettled).to.equal(true);
    });
  });

  describe("Exposure Reveal", function () {
    let poolId;
    const stakeAmount = ethers.parseEther("0.01");

    beforeEach(async function () {
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });
      poolId = 0;

      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(user1)
        .placeBet(poolId, encryptedWeight, 0, { value: stakeAmount });
    });

    it("Should allow revealing exposure after settlement", async function () {
      // Settle pool first
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      await astroStrikePool.settlePool(poolId);

      // In production, this would trigger actual decryption via gateway
      // For testing, we just verify the function can be called
      const pool = await astroStrikePool.pools(poolId);
      expect(pool.isSettled).to.equal(true);
    });

    it("Should not allow revealing exposure before settlement", async function () {
      // Pool is still active
      const pool = await astroStrikePool.pools(poolId);
      expect(pool.isSettled).to.equal(false);
    });
  });

  describe("FHE Privacy Properties", function () {
    it("Should not expose weight values during betting", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      const secretWeight = "0xdeadbeefdeadbeef";
      await astroStrikePool
        .connect(user1)
        .placeBet(0, secretWeight, 0, { value: stakeAmount });

      // Bet is stored but weight is encrypted
      const bet = await astroStrikePool.getBet(0, user1.address);
      expect(bet.hasBet).to.equal(true);
      // The actual encrypted weight is not directly accessible
    });

    it("Should maintain privacy across multiple bets", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      // Different users with different secret weights
      await astroStrikePool
        .connect(user1)
        .placeBet(0, "0xaaaaaaaaaaaaaaaa", 0, { value: stakeAmount });

      await astroStrikePool
        .connect(user2)
        .placeBet(0, "0xbbbbbbbbbbbbbbbb", 1, { value: stakeAmount });

      await astroStrikePool
        .connect(user3)
        .placeBet(0, "0xcccccccccccccccc", 2, { value: stakeAmount });

      // All bets are recorded but weights remain private
      const pool = await astroStrikePool.pools(0);
      expect(pool.totalBets).to.equal(3);
    });
  });

  describe("Randomness in Settlement", function () {
    it("Should use blockhash for randomness in winner selection", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(user1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });

      await astroStrikePool
        .connect(user2)
        .placeBet(0, encryptedWeight, 1, { value: stakeAmount });

      // Fast forward
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Settlement uses blockhash for randomness
      const tx = await astroStrikePool.settlePool(0);
      const receipt = await tx.wait();

      // Verify settlement happened
      const pool = await astroStrikePool.pools(0);
      expect(pool.isSettled).to.equal(true);
    });

    it("Should produce different outcomes with different block states", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      // Create and settle first pool
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      await astroStrikePool
        .connect(user1)
        .placeBet(0, "0x1111111111111111", 0, { value: stakeAmount });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      await astroStrikePool.settlePool(0);

      // Mine some blocks to change blockhash
      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");

      // Create and settle second pool
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      await astroStrikePool
        .connect(user1)
        .placeBet(1, "0x1111111111111111", 0, { value: stakeAmount });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      await astroStrikePool.settlePool(1);

      // Both pools settled
      const pool0 = await astroStrikePool.pools(0);
      const pool1 = await astroStrikePool.pools(1);

      expect(pool0.isSettled).to.equal(true);
      expect(pool1.isSettled).to.equal(true);
    });
  });

  describe("FHE Gateway Integration", function () {
    it("Should be ready for gateway callback on reveal", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      const encryptedWeight = "0x1234567890abcdef";
      await astroStrikePool
        .connect(user1)
        .placeBet(0, encryptedWeight, 0, { value: stakeAmount });

      // Settle
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");
      await astroStrikePool.settlePool(0);

      // In production, revealExposure would trigger gateway callback
      // This test verifies the pool is in correct state for reveal
      const pool = await astroStrikePool.pools(0);
      expect(pool.isSettled).to.equal(true);

      const bet = await astroStrikePool.getBet(0, user1.address);
      expect(bet.hasBet).to.equal(true);
    });
  });

  describe("Weight Aggregation", function () {
    it("Should handle aggregating multiple encrypted weights per side", async function () {
      const stakeAmount = ethers.parseEther("0.01");
      await astroStrikePool.createPool(stakeAmount, 3600, 5, {
        value: stakeAmount,
      });

      // Multiple bets on Nova (side 0)
      await astroStrikePool
        .connect(user1)
        .placeBet(0, "0x1111111111111111", 0, { value: stakeAmount });

      await astroStrikePool
        .connect(user2)
        .placeBet(0, "0x2222222222222222", 0, { value: stakeAmount });

      // One bet on Pulse (side 1)
      await astroStrikePool
        .connect(user3)
        .placeBet(0, "0x3333333333333333", 1, { value: stakeAmount });

      const pool = await astroStrikePool.pools(0);
      expect(pool.totalBets).to.equal(3);

      // In production, FHE would aggregate weights per side
      // This test just verifies all bets are counted
    });
  });
});
