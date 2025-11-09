import { useState, useEffect } from 'react';
import { X, Lock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { useEnterPool } from '@/hooks/usePoolContract';
import { initializeFHE, encryptWeight, isFheReady } from '@/lib/fhe';
import { ASTRO_STRIKE_POOL_ADDRESS } from '@/lib/contracts';
import { CHOICE_LABELS, type Choice } from '@/lib/types';

interface BetSheetProps {
  open: boolean;
  onClose: () => void;
  poolId: string;
  poolName: string;
  entryFee: string;
  selectedChoice: {
    name: string;
    icon: 'nova' | 'pulse' | 'flux';
  } | null;
}

const BetSheet = ({ open, onClose, poolId, poolName, entryFee, selectedChoice }: BetSheetProps) => {
  const { address, isConnected } = useAccount();
  const [weight, setWeight] = useState('100');
  const [encrypting, setEncrypting] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [fheInitialized, setFheInitialized] = useState(false);
  const [error, setError] = useState<string>('');

  const { enterPool, isPending, isConfirming, isSuccess, hash } = useEnterPool();

  // Initialize FHE on mount
  useEffect(() => {
    const initFHE = async () => {
      try {
        if (!isFheReady() && isConnected) {
          await initializeFHE();
          setFheInitialized(true);
        } else if (isFheReady()) {
          setFheInitialized(true);
        }
      } catch (err) {
        console.error('FHE initialization failed:', err);
        setError('Failed to initialize encryption system');
      }
    };

    if (open && isConnected) {
      initFHE();
    }
  }, [open, isConnected]);

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

  const getChoiceIndex = (name: string): number => {
    return name === 'Nova' ? 0 : name === 'Pulse' ? 1 : 2;
  };

  const handleConfirm = async () => {
    if (!address || !selectedChoice) return;

    setError('');
    setEncrypting(true);
    setEncryptionProgress(10);

    try {
      // Step 1: Encrypt weight with FHE
      setEncryptionProgress(30);
      const weightNum = parseInt(weight);

      if (weightNum < 1 || weightNum > 1000) {
        throw new Error('Weight must be between 1 and 1000');
      }

      const encrypted = await encryptWeight(BigInt(weightNum), ASTRO_STRIKE_POOL_ADDRESS, address);

      setEncryptionProgress(70);

      // Step 2: Submit to contract
      const choiceIndex = getChoiceIndex(selectedChoice.name);

      enterPool(
        poolId,
        choiceIndex,
        encrypted.ciphertext,
        encrypted.proof,
        parseEther(entryFee)
      );

      setEncryptionProgress(100);
      setEncrypting(false);
    } catch (err) {
      console.error('Bet failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to place bet');
      setEncrypting(false);
    }
  };

  // Reset on success
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onClose();
        setEncrypting(false);
        setEncryptionProgress(0);
        setWeight('100');
      }, 3000);
    }
  }, [isSuccess, onClose]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="glass-card border-t-4 border-t-primary rounded-t-3xl h-[85vh] overflow-y-auto"
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary animate-border-flow" />

        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-3xl font-orbitron font-bold text-primary neon-glow-primary">
              🎲 PLACE YOUR BET
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-destructive/20 hover:text-destructive"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Wallet Connection Check */}
          {!isConnected && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive font-poppins">
                ⚠️ Please connect your wallet first
              </p>
            </div>
          )}

          {/* Pool Info */}
          <div className="p-4 rounded-xl bg-card/50 border border-border">
            <p className="text-sm text-muted-foreground font-poppins mb-1">Pool</p>
            <p className="text-xl font-orbitron font-bold">{poolName}</p>
            <p className="text-sm text-primary font-rajdhani mt-1">Entry Fee: {entryFee} ETH</p>
          </div>

          {/* Selected Choice */}
          {selectedChoice && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
              <p className="text-sm text-muted-foreground font-poppins mb-2">Selected Choice</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{getChoiceEmoji(selectedChoice.icon)}</span>
                <span className="text-2xl font-orbitron font-bold text-primary">
                  {selectedChoice.name}
                </span>
              </div>
            </div>
          )}

          {/* Weight Input */}
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground font-poppins">
              Prediction Weight (1-1000)
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="100"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-16 text-2xl font-rajdhani font-bold bg-card/50 border-2 border-primary/30 focus:border-primary rounded-xl"
                min={1}
                max={1000}
                step={10}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-poppins text-sm">
                Higher = More confidence
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-poppins">
              💡 Weight determines your share if you win. Encrypted with FHE.
            </p>
          </div>

          {/* FHE Encryption Status */}
          {encrypting && (
            <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-secondary animate-pulse" />
                <span className="font-poppins text-sm text-secondary">
                  {encryptionProgress < 70 ? 'Encrypting with FHE...' : 'Submitting transaction...'}
                </span>
              </div>
              <Progress value={encryptionProgress} className="h-2" />
              <p className="text-xs text-muted-foreground font-space-mono text-center">
                {encryptionProgress}%
              </p>
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-poppins text-sm text-success">
                  Bet placed successfully!
                </span>
              </div>
              {hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-2 block"
                >
                  View on Etherscan →
                </a>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="font-poppins text-sm text-destructive">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Entry Fee Display */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-success/10 to-primary/10 border-2 border-success/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-poppins">Total Cost</span>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-rajdhani font-bold text-primary">
              💰 {entryFee} ETH
            </p>
            <p className="text-sm text-muted-foreground font-poppins mt-1">
              Entry fee (winner takes all prize pool)
            </p>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={!isConnected || !weight || encrypting || isPending || isConfirming || isSuccess}
            className="w-full h-16 bg-gradient-to-r from-primary to-primary-glow hover:shadow-[0_0_60px_rgba(255,215,0,0.8)] font-orbitron font-bold text-xl rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected
              ? 'CONNECT WALLET'
              : isPending || encrypting
              ? 'ENCRYPTING & SIGNING...'
              : isConfirming
              ? 'CONFIRMING...'
              : isSuccess
              ? '✅ SUCCESS!'
              : 'CONFIRM BET'}
          </Button>

          {/* Warning */}
          <p className="text-xs text-center text-muted-foreground font-poppins">
            ⚠️ Bets are final and cannot be cancelled once placed
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BetSheet;
