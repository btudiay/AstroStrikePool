# Astro Strike Pool

Astro Strike Pool is a three-way prediction pool (Nova/Pulse/Flux), inspired by rock-paper-scissors mechanics. Anyone can create a pool with a custom entry fee and lock time. Players choose one of the three options before the lock time and submit their encrypted weight using fhEVM. All exposure values (`euint64 exposure[3]`) remain encrypted until the lock time, preventing market sentiment leakage. Once the lock time expires, any address can call `settleReplicaPool`, and the contract uses `blockhash` to randomly determine the winning choice (0=Nova, 1=Pulse, 2=Flux) without requiring an admin or oracle. If no one chose the winning option, the pool enters a "push" state where all players can claim refunds.

## Process Overview

| Step | Description |
| --- | --- |
| `createReplicaPool(poolId, entryFee, duration)` | Create a new pool |
| `enterReplicaPool` / `adjustReplicaEntry` | Submit/adjust choice with FHE encrypted weight |
| `requestReplicaExposureReveal` → `revealReplicaCallback` | Optional exposure decryption (total exposure for Nova/Pulse/Flux) |
| `settleReplicaPool` | Anyone can trigger settlement based on `blockhash` randomness |
| `claimReplicaPrize` | Winning players split the prize pool |
| `claimReplicaRefund` | Refund entry fee if pool is cancelled or in push state |

## FHE Features

- Each option's exposure is stored as `euint64`, updated via `FHE.add`/`FHE.sub` during entry or adjustment, keeping betting distribution hidden until lock time.
- Player weight ciphertext (`weightCipher`) is only granted read access to the player via `FHE.allow`, enabling frontend self-verification of bets.
- Public exposure viewing requires initiating an fhEVM decryption request, which only outputs totals without revealing individual bets.

## Integration Guidelines

1. Frontend must use fhEVM SDK to generate `externalEuint64` and proof when submitting or adjusting entries.
2. Listen to `ExposureRevealed`, `PoolSettled`, `PoolCancelled`, `PrizeClaimed`, `RefundClaimed` events to update UI.
3. For future integration with real match results, an oracle can be added at the protocol layer; the default implementation provides fully on-chain random settlement.

## Smart Contract Functions

### Pool Management
- `createReplicaPool(string poolId, uint256 entryFee, uint256 duration)` - Create a prediction pool
- `cancelReplicaPool(string poolId)` - Cancel pool before lock time (creator only)

### Player Actions
- `enterReplicaPool(string poolId, uint8 choice, externalEuint64 encryptedWeight, bytes proof)` - Enter pool with encrypted weight
- `adjustReplicaEntry(string poolId, uint8 newChoice, externalEuint64 newEncryptedWeight, bytes proof)` - Adjust existing entry

### Settlement & Claims
- `settleReplicaPool(string poolId)` - Settle pool after lock time (anyone can call)
- `claimReplicaPrize(string poolId)` - Claim prize if you chose the winning option
- `claimReplicaRefund(string poolId)` - Claim refund if pool is cancelled or in push state

### Transparency
- `requestReplicaExposureReveal(string poolId)` - Request decryption of total exposure values
- `getReplicaPool(string poolId)` - Get pool details
- `getReplicaEntry(string poolId, address player)` - Get player entry details
- `getRevealedExposure(string poolId)` - Get revealed exposure totals

## Technology Stack

- **Blockchain**: Ethereum Sepolia Testnet
- **FHE Library**: Zama fhEVM (euint64 encrypted types)
- **Frontend**: React 18 + TypeScript + Vite
- **Web3**: Wagmi 2.x + RainbowKit 2.x + fhevmjs
- **UI**: Tailwind CSS + shadcn/ui + Recharts

## Deployment

1. Deploy `AstroStrikePool.sol` to Sepolia testnet
2. Update `ASTRO_STRIKE_POOL_ADDRESS` in `frontend/src/constants/contracts.ts`
3. Install dependencies: `cd frontend && npm install`
4. Start development server: `npm run dev`

## Privacy Guarantees

- ✅ Individual player weights remain encrypted on-chain
- ✅ Total exposure values can be revealed through Gateway decryption
- ✅ Settlement is based on blockhash randomness (fully on-chain)
- ✅ No oracle or admin required for winner determination
- ✅ Fair prize distribution based on encrypted weight commitments
