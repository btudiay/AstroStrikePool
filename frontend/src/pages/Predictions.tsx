import { Trophy, Clock, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const mockPredictions = [
  {
    id: '1',
    poolName: 'ASTRO-001',
    choice: { name: 'Nova', icon: 'nova', emoji: '🌟' },
    betAmount: '2.5',
    status: 'active',
    potentialWin: '3.8',
    endsIn: '1d 5h',
  },
  {
    id: '2',
    poolName: 'COSMIC-042',
    choice: { name: 'Pulse', icon: 'pulse', emoji: '⚡' },
    betAmount: '1.2',
    status: 'settled',
    actualWin: '2.1',
    result: 'win',
  },
  {
    id: '3',
    poolName: 'NEBULA-007',
    choice: { name: 'Flux', icon: 'flux', emoji: '🔥' },
    betAmount: '0.8',
    status: 'settled',
    actualWin: '0',
    result: 'lose',
  },
];

const Predictions = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-success">🟢 Active</Badge>;
      case 'settled':
        return <Badge className="bg-muted/20 text-muted border-muted">🟣 Settled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-primary neon-glow-primary">
          My Predictions
        </h1>
        <p className="text-muted-foreground font-poppins">
          Track your active bets and claim your winnings
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6 border-2 border-primary/30">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="text-sm text-muted-foreground font-poppins">Total Wagered</span>
          </div>
          <p className="text-3xl font-rajdhani font-bold text-primary">4.5 ETH</p>
        </Card>

        <Card className="glass-card p-6 border-2 border-success/30">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-success" />
            <span className="text-sm text-muted-foreground font-poppins">Total Won</span>
          </div>
          <p className="text-3xl font-rajdhani font-bold text-success">2.1 ETH</p>
        </Card>

        <Card className="glass-card p-6 border-2 border-accent/30">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-accent" />
            <span className="text-sm text-muted-foreground font-poppins">Active Bets</span>
          </div>
          <p className="text-3xl font-rajdhani font-bold text-accent">1</p>
        </Card>
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-orbitron font-bold text-foreground">All Predictions</h2>

        {mockPredictions.map((prediction) => (
          <Card
            key={prediction.id}
            className="glass-card hover-lift p-6 border-2 border-border hover:border-primary/50 transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Pool & Choice Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-orbitron font-bold text-primary">
                    {prediction.poolName}
                  </h3>
                  {getStatusBadge(prediction.status)}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-3xl">{prediction.choice.emoji}</span>
                  <div>
                    <p className="text-sm text-muted-foreground font-poppins">Choice</p>
                    <p className="text-lg font-rajdhani font-bold">{prediction.choice.name}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-poppins">Bet Amount</p>
                  <p className="text-xl font-rajdhani font-bold text-foreground">
                    {prediction.betAmount} ETH
                  </p>
                </div>
              </div>

              {/* Right: Status & Actions */}
              <div className="flex flex-col items-end gap-3">
                {prediction.status === 'active' ? (
                  <>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground font-poppins">Potential Win</p>
                      <p className="text-2xl font-rajdhani font-bold text-success">
                        💰 {prediction.potentialWin} ETH
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-accent">
                      <Clock className="w-4 h-4 animate-pulse-glow" />
                      <span className="font-rajdhani font-bold">{prediction.endsIn}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground font-poppins">Result</p>
                      <p
                        className={`text-2xl font-rajdhani font-bold ${
                          prediction.result === 'win' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {prediction.result === 'win' ? '🎉 Won' : '💔 Lost'}
                      </p>
                    </div>
                    {prediction.result === 'win' && (
                      <Button className="bg-gradient-to-r from-success to-primary hover:shadow-[0_0_30px_rgba(16,208,112,0.6)] font-orbitron font-bold">
                        CLAIM {prediction.actualWin} ETH
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Predictions;
