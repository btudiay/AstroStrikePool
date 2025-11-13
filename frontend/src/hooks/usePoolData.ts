import { useListPools, usePool } from './usePoolContract';
import { formatEther } from 'viem';
import { CHOICE_NAMES } from '@/lib/types';

/**
 * Format time remaining until lock time
 */
function formatTimeRemaining(lockTime: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const lockTimestamp = Number(lockTime);
  const remaining = lockTimestamp - now;

  if (remaining <= 0) return 'Ended';

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Get all pools with formatted data
 */
export function useAllPools() {
  const { poolIds, isLoading: loadingIds, refetch: refetchIds } = useListPools();

  return {
    poolIds,
    isLoading: loadingIds,
    refetch: refetchIds,
  };
}

/**
 * Get formatted pool data for UI display
 */
export function usePoolData(poolId: string | undefined) {
  const { pool, isLoading, error, refetch } = usePool(poolId);

  if (!pool) {
    return {
      pool: null,
      formatted: null,
      isLoading,
      error,
      refetch,
    };
  }

  const formatted = {
    id: pool.poolId,
    name: pool.poolId,
    totalPool: formatEther(pool.prizePool),
    participants: Number(pool.playerCount),
    endTime: formatTimeRemaining(pool.lockTime),
    entryFee: formatEther(pool.entryFee),
    isLocked: Number(pool.lockTime) * 1000 < Date.now(),
    isCancelled: pool.cancelled,
    isSettled: pool.settled,
    choices: CHOICE_NAMES.map((name, idx) => ({
      id: String(idx),
      name,
      icon: name.toLowerCase() as 'nova' | 'pulse' | 'flux',
      count: Number(pool.pickCounts[idx]),
    })),
    winningChoice: pool.winningChoice,
    creator: pool.creator,
  };

  return {
    pool,
    formatted,
    isLoading,
    error,
    refetch,
  };
}
