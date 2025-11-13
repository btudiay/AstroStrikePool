# AstroStrikePool Test Suite

This directory contains comprehensive test suites for the AstroStrikePool smart contract system.

## Test Files

### 1. AstroStrikePool.test.js
**Main contract functionality tests**

Tests covered:
- ✅ Pool Creation
  - Valid pool creation with various parameters
  - Invalid stake amounts, durations, and fee percentages
  - Event emission verification
  - Pool counter increment
- ✅ Betting Operations
  - Placing bets with encrypted weights
  - Side selection validation (Nova/Pulse/Flux)
  - Stake amount validation
  - Duplicate bet prevention
  - Bet tracking across multiple users
- ✅ Settlement Logic
  - Timing constraints for settlement
  - Pool state transitions
  - Event emission on settlement
  - Prevention of duplicate settlements
- ✅ Reward Claims
  - Post-settlement reward claiming
  - Validation of bet existence
  - Double claim prevention
- ✅ View Functions
  - Pool information retrieval
  - Bet status queries
  - Pool counter verification
- ✅ Edge Cases
  - Multiple simultaneous pools
  - User participation in multiple pools
  - Minimum and maximum duration pools

**Test Count:** ~40+ individual test cases

---

### 2. Integration.test.js
**End-to-end integration tests**

Tests covered:
- ✅ Complete Pool Lifecycle
  - Full flow: create → bet → settle → claim
  - Pools with no bets
  - Pools with one-sided betting
- ✅ Multiple Pool Interactions
  - Simultaneous active pools
  - Independent pool settlements
  - Cross-pool user participation
- ✅ Gas Optimization
  - Pool creation gas measurement
  - Bet placement gas measurement
  - Settlement gas measurement
- ✅ Stress Tests
  - Many bets on single pool (10+ bets)
  - Creating many pools (10+ pools)
  - High-load scenarios
- ✅ Event Emission
  - Event ordering verification
  - Event parameter validation
  - Full lifecycle event tracking
- ✅ Security
  - Reentrancy protection verification
  - Unauthorized settlement prevention
  - Stake amount validation
- ✅ Contract Balance
  - Balance tracking through operations
  - ETH flow verification

**Test Count:** ~25+ integration scenarios

---

### 3. FHE.test.js
**Fully Homomorphic Encryption specific tests**

Tests covered:
- ✅ Encrypted Weight Handling
  - Storage of encrypted weights
  - Different encrypted values per user
  - Empty weight handling
- ✅ Weight Comparison and Settlement
  - Encrypted weight comparisons
  - Equal weight handling
  - Winner determination logic
- ✅ Exposure Reveal
  - Post-settlement reveals
  - Timing constraints for reveals
- ✅ Privacy Properties
  - Weight confidentiality during betting
  - Privacy across multiple bets
  - No leakage of encrypted data
- ✅ Randomness in Settlement
  - Blockhash usage for randomness
  - Different outcomes with different block states
- ✅ FHE Gateway Integration
  - Gateway callback readiness
  - Decryption request preparation
- ✅ Weight Aggregation
  - Multiple weights per side
  - Aggregation logic verification

**Test Count:** ~20+ FHE-specific scenarios

---

## Running Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Test File
```bash
npx hardhat test test/AstroStrikePool.test.js
npx hardhat test test/Integration.test.js
npx hardhat test test/FHE.test.js
```

### Run Tests with Gas Reporter
```bash
REPORT_GAS=true npx hardhat test
```

### Run Tests with Coverage
```bash
npx hardhat coverage
```

### Run Tests on Specific Network
```bash
npx hardhat test --network sepolia
```

---

## Test Structure

Each test follows this pattern:

```javascript
describe("Feature Category", function () {
  // Setup
  beforeEach(async function () {
    // Deploy contracts, set up test environment
  });

  it("Should perform expected behavior", async function () {
    // Arrange: Set up test data
    // Act: Execute function
    // Assert: Verify results
  });
});
```

---

## Coverage Goals

| Category | Target Coverage | Current Status |
|----------|----------------|----------------|
| Statements | 95%+ | ✅ |
| Branches | 90%+ | ✅ |
| Functions | 100% | ✅ |
| Lines | 95%+ | ✅ |

---

## Key Test Scenarios

### 1. Happy Path
- User creates pool → Others bet → Duration ends → Settlement → Winners claim

### 2. Error Paths
- Invalid parameters
- Unauthorized access
- Timing violations
- Double operations

### 3. Edge Cases
- Zero bets
- Maximum participants
- Minimum/maximum durations
- Extreme stake amounts

### 4. Security
- Reentrancy attempts
- Overflow/underflow
- Access control
- State manipulation

---

## Mock Data

### Encrypted Weights (for testing)
```javascript
const encryptedWeights = {
  high: "0xffffffffffffffff",
  medium: "0x8888888888888888",
  low: "0x1111111111111111",
  zero: "0x0000000000000000",
};
```

### Test Accounts
- `owner`: Contract deployer
- `creator`: Pool creator
- `bettor1`, `bettor2`, `bettor3`: Betting participants
- `user1`, `user2`, `user3`: General test users

---

## Continuous Integration

### GitHub Actions Workflow
```yaml
- name: Run Tests
  run: npx hardhat test

- name: Generate Coverage
  run: npx hardhat coverage

- name: Upload Coverage Reports
  uses: codecov/codecov-action@v3
```

---

## Debugging Tests

### Enable Console Logs
```javascript
console.log("Pool state:", pool);
console.log("Gas used:", receipt.gasUsed.toString());
```

### Time Manipulation
```javascript
// Fast forward time
await ethers.provider.send("evm_increaseTime", [3600]);
await ethers.provider.send("evm_mine");
```

### Snapshot and Revert
```javascript
const snapshot = await ethers.provider.send("evm_snapshot", []);
// ... run tests ...
await ethers.provider.send("evm_revert", [snapshot]);
```

---

## Test Data Fixtures

Create test fixtures for common scenarios:

```javascript
async function createPoolFixture() {
  const [owner, user1] = await ethers.getSigners();
  const AstroStrikePool = await ethers.getContractFactory("AstroStrikePool");
  const contract = await AstroStrikePool.deploy();

  const stakeAmount = ethers.parseEther("0.01");
  await contract.createPool(stakeAmount, 3600, 5, { value: stakeAmount });

  return { contract, owner, user1, poolId: 0 };
}
```

---

## Known Limitations

1. **FHE Operations**: Tests use mock encrypted data. Real FHE encryption requires actual Zama SDK integration.
2. **Gateway Callbacks**: Decryption callbacks from Gateway are not simulated in tests.
3. **Network Conditions**: Tests run on local Hardhat network, not actual Sepolia testnet.

---

## Future Enhancements

- [ ] Add fuzzing tests with Echidna
- [ ] Implement property-based testing
- [ ] Add formal verification
- [ ] Performance benchmarking
- [ ] Cross-chain interaction tests
- [ ] Real FHE SDK integration tests

---

## Troubleshooting

### Common Issues

**1. Tests timing out**
```bash
# Increase timeout in hardhat.config.js
mocha: {
  timeout: 100000
}
```

**2. Gas estimation errors**
```bash
# Use hardhat network with higher gas limit
networks: {
  hardhat: {
    blockGasLimit: 30000000
  }
}
```

**3. Nonce issues**
```bash
# Reset Hardhat network
npx hardhat node --no-deploy
```

---

## Contact

For test-related questions or issues, please refer to the main project README or open an issue on GitHub.
