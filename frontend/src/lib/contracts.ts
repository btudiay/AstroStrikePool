import ABI from './AstroStrikePoolABI.json';

// Deployed contract address on Sepolia testnet
export const ASTRO_STRIKE_POOL_ADDRESS = '0x7770E5F024a5c3781Cf986A9B5b46e1a199E1b4e' as `0x${string}`;

export const ASTRO_STRIKE_POOL_ABI = ABI as const;

export const SEPOLIA_CHAIN_ID = 11155111;

// Contract constants
export const MIN_ENTRY_FEE = '0.0005'; // ETH
export const MIN_DURATION = 300; // seconds (5 minutes)
export const MAX_DURATION = 2592000; // seconds (30 days)
