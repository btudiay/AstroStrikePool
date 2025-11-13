import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import PoolCard from '@/components/PoolCard';
import BetSheet from '@/components/BetSheet';
import { CreatePoolDialog } from '@/components/CreatePoolDialog';
import { useAllPools, usePoolData } from '@/hooks/usePoolData';

const Index = () => {
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [betSheetOpen, setBetSheetOpen] = useState(false);

  // Get all pool IDs from contract
  const { poolIds, isLoading: loadingIds } = useAllPools();

  // Debug logging
  console.log('AstroStrikePool Debug:', { poolIds, loadingIds });

  // Get data for each pool individually (limited to first 10)
  const pool0 = usePoolData(poolIds[0]);
  const pool1 = usePoolData(poolIds[1]);
  const pool2 = usePoolData(poolIds[2]);
  const pool3 = usePoolData(poolIds[3]);
  const pool4 = usePoolData(poolIds[4]);
  const pool5 = usePoolData(poolIds[5]);
  const pool6 = usePoolData(poolIds[6]);
  const pool7 = usePoolData(poolIds[7]);
  const pool8 = usePoolData(poolIds[8]);
  const pool9 = usePoolData(poolIds[9]);

  const allPoolData = [pool0, pool1, pool2, pool3, pool4, pool5, pool6, pool7, pool8, pool9];
  const pools = allPoolData.filter(p => p.formatted !== null).map(p => p.formatted!);
  const loadingPools = allPoolData.some(p => p.isLoading);

  console.log('Pools data:', { pools, loadingPools });

  const handlePlaceBet = (poolId: string) => {
    setSelectedPool(poolId);
    setBetSheetOpen(true);
  };

  const selectedPoolData = pools.find(p => p.id === selectedPool);

  const isLoading = loadingIds || loadingPools;

  // Calculate stats from real data
  const totalVolume = pools.reduce((sum, p) => sum + parseFloat(p.totalPool), 0).toFixed(4);
  const totalParticipants = pools.reduce((sum, p) => sum + p.participants, 0);
  const activePools = pools.filter(p => !p.isLocked && !p.isCancelled).length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-12 h-12 text-primary animate-pulse-glow" />
          <h1 className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
            AstroStrikePool
          </h1>
          <Sparkles className="w-12 h-12 text-accent animate-pulse-glow" />
        </div>
        <p className="text-xl md:text-2xl text-muted-foreground font-poppins max-w-2xl mx-auto">
          🎰 Luxury Space Prediction Market
        </p>
        <p className="text-sm text-muted-foreground font-poppins">
          Powered by FHE Encryption • Trustless • Transparent
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <ConnectButton
            showBalance={true}
            chainStatus="icon"
          />
          <CreatePoolDialog />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary via-accent to-transparent animate-border-flow" />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl text-center border-2 border-primary/30">
          <p className="text-3xl font-rajdhani font-bold text-primary">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin inline" /> : totalVolume}
          </p>
          <p className="text-sm text-muted-foreground font-poppins">Total Volume (ETH)</p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center border-2 border-accent/30">
          <p className="text-3xl font-rajdhani font-bold text-accent">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin inline" /> : activePools}
          </p>
          <p className="text-sm text-muted-foreground font-poppins">Active Pools</p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center border-2 border-secondary/30">
          <p className="text-3xl font-rajdhani font-bold text-secondary">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin inline" /> : totalParticipants}
          </p>
          <p className="text-sm text-muted-foreground font-poppins">Participants</p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center border-2 border-success/30">
          <p className="text-3xl font-rajdhani font-bold text-success">
            {pools.length}
          </p>
          <p className="text-sm text-muted-foreground font-poppins">Total Pools</p>
        </div>
      </div>

      {/* Active Pools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-orbitron font-bold text-foreground">
            🔥 Active Pools
          </h2>
          <p className="text-muted-foreground font-poppins">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin inline" />
            ) : (
              `${pools.length} pools available`
            )}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <p className="text-xl font-orbitron text-muted-foreground">
                Loading pools from blockchain...
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && pools.length === 0 && (
          <div className="glass-card p-12 rounded-2xl text-center border-2 border-primary/30">
            <p className="text-2xl font-orbitron text-muted-foreground">
              No pools available yet
            </p>
            <p className="text-sm text-muted-foreground font-poppins mt-2">
              Check back soon for new prediction pools!
            </p>
          </div>
        )}

        {/* Pool Grid */}
        {!isLoading && pools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <PoolCard
                key={pool.id}
                {...pool}
                onPlaceBet={handlePlaceBet}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bet Sheet */}
      <BetSheet
        open={betSheetOpen}
        onClose={() => setBetSheetOpen(false)}
        poolId={selectedPoolData?.id || ''}
        poolName={selectedPoolData?.name || ''}
        entryFee={selectedPoolData?.entryFee || '0'}
        selectedChoice={selectedPoolData?.choices[0] || null}
      />
    </div>
  );
};

export default Index;
