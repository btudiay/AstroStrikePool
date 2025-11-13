import { User, Wallet, Trophy, BarChart } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Profile = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-primary neon-glow-primary">
          Profile
        </h1>
        <p className="text-muted-foreground font-poppins">
          View your stats and achievements
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Profile Card */}
      <Card className="glass-card p-8 border-2 border-primary/30">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <User className="w-12 h-12 text-background" />
          </div>
          <div>
            <h2 className="text-2xl font-orbitron font-bold mb-1">0x1234...5678</h2>
            <p className="text-muted-foreground font-poppins">Member since Jan 2025</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card p-6 border-2 border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-orbitron font-bold">Wallet Stats</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground font-poppins">Total Wagered</p>
              <p className="text-2xl font-rajdhani font-bold text-foreground">4.5 ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-poppins">Current Balance</p>
              <p className="text-2xl font-rajdhani font-bold text-primary">12.3 ETH</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6 border-2 border-success/30">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-success" />
            <h3 className="text-lg font-orbitron font-bold">Performance</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground font-poppins">Win Rate</p>
              <p className="text-2xl font-rajdhani font-bold text-success">66.7%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-poppins">Total Wins</p>
              <p className="text-2xl font-rajdhani font-bold text-foreground">2 / 3</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6 border-2 border-accent/30 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="w-6 h-6 text-accent" />
            <h3 className="text-lg font-orbitron font-bold">Activity</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-poppins">Total Bets</p>
              <p className="text-2xl font-rajdhani font-bold text-foreground">3</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-poppins">Active Pools</p>
              <p className="text-2xl font-rajdhani font-bold text-accent">1</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-poppins">Settled</p>
              <p className="text-2xl font-rajdhani font-bold text-muted">2</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
