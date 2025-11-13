import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { ASTRO_STRIKE_POOL_ADDRESS, ASTRO_STRIKE_POOL_ABI } from '@/lib/contracts';
import type { Pool, Entry } from '@/lib/types';

// ==================== READ HOOKS ====================

/**
 * Get list of all pool IDs
 */
export function useListPools() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ASTRO_STRIKE_POOL_ADDRESS,
    abi: ASTRO_STRIKE_POOL_ABI,
    functionName: 'listReplicaPools',
  });

  return {
    poolIds: (data as string[]) || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get pool details by ID
 */
export function usePool(poolId: string | undefined) {
  const poolQuery = useReadContract({
    address: ASTRO_STRIKE_POOL_ADDRESS,
    abi: ASTRO_STRIKE_POOL_ABI,
    functionName: 'getReplicaPool',
    args: poolId ? [poolId] : undefined,
    query: {
      enabled: !!poolId,
    },
  });

  const pickCountsQuery = useReadContract({
    address: ASTRO_STRIKE_POOL_ADDRESS,
    abi: ASTRO_STRIKE_POOL_ABI,
    functionName: 'getPickCounts',
    args: poolId ? [poolId] : undefined,
    query: {
      enabled: !!poolId
    }
  });

  const playerCountQuery = useReadContract({
    address: ASTRO_STRIKE_POOL_ADDRESS,
    abi: ASTRO_STRIKE_POOL_ABI,
    functionName: 'getPlayerCount',
    args: poolId ? [poolId] : undefined,
    query: {
      enabled: !!poolId
    }
  });

  const poolData = poolQuery.data;
  const pickCountsData = pickCountsQuery.data as bigint[] | undefined;
  const playerCountData = playerCountQuery.data as bigint | undefined;

  const pool: Pool | undefined = poolData
    ? {
        poolId: poolId ?? '',
        creator: poolData[0],
        entryFee: poolData[1],
        lockTime: poolData[2],
        prizePool: poolData[3],
        cancelled: poolData[4],
        settled: poolData[5],
        pushAll: poolData[6],
        winningChoice: Number(poolData[7]),
        winnerCount: poolData[8],
        pickCounts: pickCountsData
          ? [pickCountsData[0], pickCountsData[1], pickCountsData[2]] as [bigint, bigint, bigint]
          : [0n, 0n, 0n],
        playerCount: playerCountData ?? 0n
      }
    : undefined;

  return {
    pool,
    isLoading: poolQuery.isLoading || pickCountsQuery.isLoading || playerCountQuery.isLoading,
    error: poolQuery.error || pickCountsQuery.error || playerCountQuery.error,
    refetch: () => {
      poolQuery.refetch();
      pickCountsQuery.refetch();
      playerCountQuery.refetch();
    },
  };
}

/**
 * Get user's entry for a pool
 */
export function useUserEntry(poolId: string | undefined, userAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ASTRO_STRIKE_POOL_ADDRESS,
    abi: ASTRO_STRIKE_POOL_ABI,
    functionName: 'getReplicaEntry',
    args: poolId && userAddress ? [poolId, userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!poolId && !!userAddress,
    },
  });

  const entry: Entry | undefined = data
    ? {
        exists: data[0] as boolean,
        claimed: data[1] as boolean,
        choice: Number(data[2]),
      }
    : undefined;

  return {
    entry,
    isLoading,
    error,
    refetch,
  };
}

// ==================== WRITE HOOKS ====================

/**
 * Create a new pool
 */
export function useCreatePool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPool = (poolId: string, entryFee: bigint, duration: number) => {
    writeContract({
      address: ASTRO_STRIKE_POOL_ADDRESS,
      abi: ASTRO_STRIKE_POOL_ABI,
      functionName: 'createReplicaPool',
      args: [poolId, entryFee, duration],
    });
  };

  return {
    createPool,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Enter a pool with encrypted weight
 */
export function useEnterPool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const enterPool = (
    poolId: string,
    choice: number,
    encryptedWeight: string,
    proof: string,
    entryFee: bigint
  ) => {
    writeContract({
      address: ASTRO_STRIKE_POOL_ADDRESS,
      abi: ASTRO_STRIKE_POOL_ABI,
      functionName: 'enterReplicaPool',
      args: [poolId, choice, encryptedWeight as `0x${string}`, proof as `0x${string}`],
      value: entryFee,
    });
  };

  return {
    enterPool,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Claim prize after settlement
 */
export function useClaimPrize() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimPrize = (poolId: string) => {
    writeContract({
      address: ASTRO_STRIKE_POOL_ADDRESS,
      abi: ASTRO_STRIKE_POOL_ABI,
      functionName: 'claimReplicaPrize',
      args: [poolId],
    });
  };

  return {
    claimPrize,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Claim refund if pool is cancelled or push all
 */
export function useClaimRefund() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRefund = (poolId: string) => {
    writeContract({
      address: ASTRO_STRIKE_POOL_ADDRESS,
      abi: ASTRO_STRIKE_POOL_ABI,
      functionName: 'claimReplicaRefund',
      args: [poolId],
    });
  };

  return {
    claimRefund,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}
