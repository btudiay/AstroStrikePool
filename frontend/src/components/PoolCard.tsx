import { Trophy, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PoolCardProps {
  id: string;
  name: string;
  totalPool: string;
  participants: number;
  endTime: string;
  choices: {
    id: string;
    name: string;
    icon: 'nova' | 'pulse' | 'flux';
  }[];
  onPlaceBet: (poolId: string, choice: { name: string; icon: 'nova' | 'pulse' | 'flux' }) => void;
}

const PoolCard = ({ id, name, totalPool, participants, endTime, choices, onPlaceBet }: PoolCardProps) => {
  const getChoiceStyles = (icon: string) => {
    switch (icon) {
      case 'nova':
        return 'border-primary bg-primary/10 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]';
      case 'pulse':
        return 'border-secondary bg-secondary/10 hover:shadow-[0_0_30px_rgba(0,255,240,0.4)]';
      case 'flux':
        return 'border-accent bg-accent/10 hover:shadow-[0_0_30px_rgba(255,16,240,0.4)]';
      default:
        return '';
    }
  };

  const getChoiceEmoji = (icon: string) => {
    switch (icon) {
      case 'nova':
        return '🌟';
      case 'pulse':
        return '⚡';
      case 'flux':
        return '🔥';
      default:
        return '💎';
    }
  };

  return (
    <Card className="glass-card hover-lift p-6 space-y-4 border-2 border-primary/30 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)]">
      {/* Pool Name */}
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="text-2xl font-orbitron font-bold text-primary neon-glow-primary">
          {name}
        </h3>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />

      {/* Choices */}
      <div className="grid grid-cols-3 gap-3">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onPlaceBet(id, { name: choice.name, icon: choice.icon })}
            className={`
              relative flex flex-col items-center justify-center
              aspect-square rounded-2xl border-2
              transition-all duration-300 hover:scale-105 cursor-pointer
              ${getChoiceStyles(choice.icon)}
            `}
          >
            <span className="text-4xl mb-2">{getChoiceEmoji(choice.icon)}</span>
            <span className="text-sm font-rajdhani font-bold tracking-wider">
              {choice.name}
            </span>
            <span className="absolute top-2 right-2 text-xs font-poppins bg-background/80 px-2 py-1 rounded">
              Click to bet
            </span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Trophy className="w-4 h-4" />
            <span className="font-poppins">Total Pool</span>
          </div>
          <p className="text-xl font-rajdhani font-bold text-primary">
            {totalPool} ETH
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            <span className="font-poppins">Participants</span>
          </div>
          <p className="text-xl font-rajdhani font-bold text-foreground">
            {participants}
          </p>
        </div>
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/30">
        <Clock className="w-5 h-5 text-accent animate-pulse-glow" />
        <span className="font-poppins text-sm text-muted-foreground">Ends in:</span>
        <span className="font-rajdhani font-bold text-accent text-lg">{endTime}</span>
      </div>

      {/* Info Text */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground font-poppins">
          👆 Click any choice above to place your bet
        </p>
      </div>
    </Card>
  );
};

export default PoolCard;
