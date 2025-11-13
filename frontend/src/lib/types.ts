export type Choice = 'Nova' | 'Pulse' | 'Flux';

export interface Pool {
  poolId: string;
  creator: string;
  entryFee: bigint;
  lockTime: bigint;
  prizePool: bigint;
  cancelled: boolean;
  settled: boolean;
  pushAll: boolean;
  winnerCount: bigint;
  pickCounts: [bigint, bigint, bigint];
  winningChoice: number;
  playerCount: bigint;
}

export interface Entry {
  exists: boolean;
  claimed: boolean;
  choice: number; // 0=Nova, 1=Pulse, 2=Flux
}

export const CHOICE_NAMES: Choice[] = ['Nova', 'Pulse', 'Flux'];

export const CHOICE_LABELS = {
  Nova: { emoji: '🌟', name: 'Nova', color: '#FFD700' },
  Pulse: { emoji: '⚡', name: 'Pulse', color: '#00FFF0' },
  Flux: { emoji: '🔥', name: 'Flux', color: '#FF10F0' }
};
