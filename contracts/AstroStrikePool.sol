// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { EthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Astro Strike Pool
 * @notice Self-service strike pool (rock-paper-scissors style) with encrypted exposure.
 *         Users create pools, players submit encrypted choices, exposures remain private until optional reveal,
 *         and settlement relies purely on blockhash randomness—no admin approvals.
 * @dev Updated to fhEVM 0.9.0 - uses EthereumConfig and two-step public decryption
 */
contract AstroStrikePool is EthereumConfig {
    enum Choice {
        Nova,
        Pulse,
        Flux
    }

    struct Pool {
        bool exists;
        string poolId;
        address creator;
        uint256 entryFee;
        uint256 lockTime;
        uint256 prizePool;
        bool cancelled;
        bool settled;
        bool exposuresReady;
        bool pushAll;
        uint256 winnerCount;
        euint64[3] exposure;
        uint64[3] revealedExposure;
        uint256[3] pickCounts;
        uint8 winningChoice;
        address[] players;
    }

    struct Entry {
        bool exists;
        bool claimed;
        uint8 choice;
        euint64 weightCipher;
    }

    mapping(string => Pool) private pools;
    mapping(string => mapping(address => Entry)) private entries;
    string[] private poolIds;

    uint256 public constant MIN_ENTRY_FEE = 0.0005 ether;
    uint256 public constant MIN_DURATION = 5 minutes;
    uint256 public constant MAX_DURATION = 30 days;

    event PoolCreated(string indexed poolId, address indexed creator, uint256 entryFee, uint256 lockTime);
    event EntrySubmitted(string indexed poolId, address indexed player, uint8 choice);
    event EntryAdjusted(string indexed poolId, address indexed player, uint8 newChoice);
    event ExposureRevealRequested(string indexed poolId, uint256 requestId);
    event ExposureRevealed(string indexed poolId, uint64 novaExposure, uint64 pulseExposure, uint64 fluxExposure);
    event PoolSettled(string indexed poolId, bool pushAll, uint8 winningChoice, uint256 winnerCount);
    event PoolCancelled(string indexed poolId);
    event PrizeClaimed(string indexed poolId, address indexed player, uint256 amount);
    event RefundClaimed(string indexed poolId, address indexed player, uint256 amount);

    error PoolExists();
    error PoolMissing();
    error InvalidFee();
    error InvalidDuration();
    error InvalidChoice();
    error Locked();
    error AlreadyEntered();
    error EntryNotFound();
    error RevealInProgress();
    error RevealNotPending();
    error NotSettled();
    error NotWinner();
    error AlreadyClaimed();
    error NotRefundable();
    error InvalidRequest();

    /** ---------------- Creation ---------------- */

    function createReplicaPool(
        string memory poolId,
        uint256 entryFee,
        uint256 duration
    ) external {
        if (pools[poolId].exists) revert PoolExists();
        if (entryFee < MIN_ENTRY_FEE) revert InvalidFee();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();

        Pool storage pool = pools[poolId];
        pool.exists = true;
        pool.poolId = poolId;
        pool.creator = msg.sender;
        pool.entryFee = entryFee;
        pool.lockTime = block.timestamp + duration;
        pool.winningChoice = type(uint8).max;
        pool.exposure[0] = FHE.asEuint64(0);
        pool.exposure[1] = FHE.asEuint64(0);
        pool.exposure[2] = FHE.asEuint64(0);
        for (uint8 i = 0; i < 3; i++) {
            FHE.allowThis(pool.exposure[i]);
        }

        poolIds.push(poolId);
        emit PoolCreated(poolId, msg.sender, entryFee, pool.lockTime);
    }

    /** ---------------- Participation ---------------- */

    function enterReplicaPool(
        string memory poolId,
        uint8 choice,
        externalEuint64 encryptedWeight,
        bytes calldata proof
    ) external payable {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        if (pool.cancelled) revert Locked();
        if (block.timestamp >= pool.lockTime) revert Locked();
        if (choice > uint8(Choice.Flux)) revert InvalidChoice();
        if (msg.value != pool.entryFee) revert InvalidFee();

        Entry storage entry = entries[poolId][msg.sender];
        if (entry.exists) revert AlreadyEntered();

        euint64 weight = FHE.fromExternal(encryptedWeight, proof);
        _updateExposure(pool, choice, weight, true);

        entry.exists = true;
        entry.claimed = false;
        entry.choice = choice;
        entry.weightCipher = weight;
        FHE.allow(weight, msg.sender);

        pool.prizePool += msg.value;
        pool.players.push(msg.sender);

        emit EntrySubmitted(poolId, msg.sender, choice);
    }

    function adjustReplicaEntry(
        string memory poolId,
        uint8 newChoice,
        externalEuint64 newEncryptedWeight,
        bytes calldata proof
    ) external {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        if (pool.cancelled) revert Locked();
        if (block.timestamp >= pool.lockTime) revert Locked();
        if (newChoice > uint8(Choice.Flux)) revert InvalidChoice();

        Entry storage entry = entries[poolId][msg.sender];
        if (!entry.exists) revert EntryNotFound();

        _updateExposure(pool, entry.choice, entry.weightCipher, false);

        euint64 newWeight = FHE.fromExternal(newEncryptedWeight, proof);
        _updateExposure(pool, newChoice, newWeight, true);

        entry.choice = newChoice;
        entry.weightCipher = newWeight;
        entry.claimed = false;
        FHE.allow(newWeight, msg.sender);

        emit EntryAdjusted(poolId, msg.sender, newChoice);
    }

    /** ---------------- Exposure Reveal (Two-Step Public Decryption) ---------------- */

    /// @notice Step 1: Mark all exposures for public decryption
    /// @param poolId The pool identifier
    function markReplicaExposuresForReveal(string memory poolId) external {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        if (pool.cancelled) revert Locked();
        if (block.timestamp < pool.lockTime) revert Locked();
        if (pool.exposuresReady || pool.settled) revert RevealInProgress();

        FHE.makePubliclyDecryptable(pool.exposure[0]);
        FHE.makePubliclyDecryptable(pool.exposure[1]);
        FHE.makePubliclyDecryptable(pool.exposure[2]);

        pool.exposuresReady = true;
        emit ExposureRevealRequested(poolId, 0);
    }

    /// @notice Step 2: Get revealed Nova exposure (after 2+ blocks)
    /// @param poolId The pool identifier
    /// @return The decrypted Nova exposure value
    function getReplicaNovaExposure(string memory poolId) external view returns (uint64) {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        if (!pool.exposuresReady) revert RevealNotPending();
        require(FHE.isPubliclyDecryptable(pool.exposure[0]), "Not yet decryptable");
        return uint64(uint256(euint64.unwrap(pool.exposure[0])));
    }

    /// @notice Step 2: Get revealed Pulse exposure (after 2+ blocks)
    /// @param poolId The pool identifier
    /// @return The decrypted Pulse exposure value
    function getReplicaPulseExposure(string memory poolId) external view returns (uint64) {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        if (!pool.exposuresReady) revert RevealNotPending();
        require(FHE.isPubliclyDecryptable(pool.exposure[1]), "Not yet decryptable");
        return uint64(uint256(euint64.unwrap(pool.exposure[1])));
    }

    /// @notice Step 2: Get revealed Flux exposure (after 2+ blocks)
    /// @param poolId The pool identifier
    /// @return The decrypted Flux exposure value
    function getReplicaFluxExposure(string memory poolId) external view returns (uint64) {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        if (!pool.exposuresReady) revert RevealNotPending();
        require(FHE.isPubliclyDecryptable(pool.exposure[2]), "Not yet decryptable");
        return uint64(uint256(euint64.unwrap(pool.exposure[2])));
    }

    /** ---------------- Settlement ---------------- */

    function settleReplicaPool(string memory poolId) external {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        if (pool.cancelled) revert Locked();
        if (block.timestamp < pool.lockTime) revert Locked();
        if (pool.settled) revert RevealInProgress();

        bytes32 rand = keccak256(abi.encode(blockhash(block.number - 1), poolId, pool.players.length));
        uint8 outcome = uint8(uint256(rand) % 3); // 0 Nova, 1 Pulse, 2 Flux
        pool.winningChoice = outcome;
        pool.winnerCount = pool.pickCounts[outcome];
        pool.pushAll = (pool.winnerCount == 0);
        pool.settled = true;

        emit PoolSettled(poolId, pool.pushAll, outcome, pool.winnerCount);
    }

    function cancelReplicaPool(string memory poolId) external {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        require(msg.sender == pool.creator, "Only creator");
        if (pool.settled) revert RevealInProgress();
        pool.cancelled = true;
        pool.exposuresReady = false;
        emit PoolCancelled(poolId);
    }

    /** ---------------- Claims ---------------- */

    function claimReplicaPrize(string memory poolId) external {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        if (!pool.settled || pool.cancelled || pool.pushAll) revert NotSettled();

        Entry storage entry = entries[poolId][msg.sender];
        if (!entry.exists) revert NotWinner();
        if (entry.claimed) revert AlreadyClaimed();
        if (entry.choice != pool.winningChoice) revert NotWinner();

        uint256 winners = pool.winnerCount;
        require(winners > 0, "No winners");
        uint256 payout = pool.prizePool / winners;

        entry.claimed = true;
        (bool sent, ) = payable(msg.sender).call{ value: payout }("");
        require(sent, "transfer failed");

        emit PrizeClaimed(poolId, msg.sender, payout);
    }

    function claimReplicaRefund(string memory poolId) external {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();

        Entry storage entry = entries[poolId][msg.sender];
        if (!entry.exists) revert NotRefundable();
        if (entry.claimed) revert AlreadyClaimed();

        bool refundable = pool.cancelled || (pool.settled && pool.pushAll);
        if (!refundable) revert NotRefundable();

        entry.claimed = true;
        (bool sent, ) = payable(msg.sender).call{ value: pool.entryFee }("");
        require(sent, "refund failed");

        emit RefundClaimed(poolId, msg.sender, pool.entryFee);
    }

    /** ---------------- Views ---------------- */

    function listReplicaPools() external view returns (string[] memory) {
        return poolIds;
    }

    function getReplicaPool(string memory poolId)
        external
        view
        returns (
            address creator,
            uint256 entryFee,
            uint256 lockTime,
            uint256 prizePool,
            bool cancelled,
            bool settled,
            bool pushAll,
            uint8 winningChoice,
            uint256 winnerCount
        )
    {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        return (
            pool.creator,
            pool.entryFee,
            pool.lockTime,
            pool.prizePool,
            pool.cancelled,
            pool.settled,
            pool.pushAll,
            pool.winningChoice,
            pool.winnerCount
        );
    }

    /** ---------------- Helper Functions ---------------- */

    /// @notice Update exposure for a choice (add or subtract encrypted weight)
    /// @param pool The pool storage reference
    /// @param choice The choice index (0=Nova, 1=Pulse, 2=Flux)
    /// @param weight The encrypted weight to add or subtract
    /// @param add True to add, false to subtract
    function _updateExposure(Pool storage pool, uint8 choice, euint64 weight, bool add) private {
        if (add) {
            pool.exposure[choice] = FHE.add(pool.exposure[choice], weight);
            pool.pickCounts[choice]++;
        } else {
            pool.exposure[choice] = FHE.sub(pool.exposure[choice], weight);
            pool.pickCounts[choice]--;
        }
    }

    /// @notice Get player entry details
    /// @param poolId The pool identifier
    /// @param player The player address
    /// @return exists Whether entry exists
    /// @return claimed Whether prize/refund is claimed
    /// @return choice The player's choice
    /// @return cipherHandle The encrypted weight handle as bytes32
    function getReplicaEntry(string memory poolId, address player)
        external
        view
        returns (bool exists, bool claimed, uint8 choice, bytes32 cipherHandle)
    {
        Entry storage entry = entries[poolId][player];
        return (
            entry.exists,
            entry.claimed,
            entry.choice,
            euint64.unwrap(entry.weightCipher)
        );
    }

    /// @notice Get revealed exposure values for a pool
    /// @param poolId The pool identifier
    /// @return The revealed exposure array [Nova, Pulse, Flux]
    function getRevealedExposure(string memory poolId)
        external
        view
        returns (uint64[3] memory)
    {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        return pool.revealedExposure;
    }

    /// @notice Get total number of players in a pool
    /// @param poolId The pool identifier
    /// @return The number of players
    function getPlayerCount(string memory poolId) external view returns (uint256) {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        return pool.players.length;
    }

    /// @notice Get pick counts for each choice
    /// @param poolId The pool identifier
    /// @return The pick counts array [Nova, Pulse, Flux]
    function getPickCounts(string memory poolId) external view returns (uint256[3] memory) {
        Pool storage pool = pools[poolId];
        if (!pool.exists) revert PoolMissing();
        return pool.pickCounts;
    }
}
