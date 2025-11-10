import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreatePool } from '@/hooks/usePoolContract';
import { MIN_ENTRY_FEE, MIN_DURATION, MAX_DURATION } from '@/lib/contracts';

export function CreatePoolDialog() {
  const { isConnected } = useAccount();
  const [open, setOpen] = useState(false);

  // Form state
  const [poolId, setPoolId] = useState('');
  const [entryFee, setEntryFee] = useState(MIN_ENTRY_FEE);
  const [durationHours, setDurationHours] = useState('24');
  const [error, setError] = useState('');

  const { createPool, isPending, isConfirming, isSuccess, hash } = useCreatePool();

  // Reset form on success
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        setOpen(false);
        setPoolId('');
        setEntryFee(MIN_ENTRY_FEE);
        setDurationHours('24');
        setError('');
      }, 3000);
    }
  }, [isSuccess]);

  const handleSubmit = () => {
    setError('');

    // Validation
    if (!poolId || poolId.length < 3) {
      setError('Pool ID must be at least 3 characters');
      return;
    }

    const feeValue = parseFloat(entryFee);
    if (isNaN(feeValue) || feeValue < parseFloat(MIN_ENTRY_FEE)) {
      setError(`Entry fee must be at least ${MIN_ENTRY_FEE} ETH`);
      return;
    }

    const hours = parseInt(durationHours);
    if (isNaN(hours) || hours < 1 || hours > 720) {
      setError('Duration must be between 1 hour and 720 hours (30 days)');
      return;
    }

    const durationSeconds = hours * 3600;
    if (durationSeconds < MIN_DURATION || durationSeconds > MAX_DURATION) {
      setError(`Duration must be between ${MIN_DURATION/3600} hours and ${MAX_DURATION/86400} days`);
      return;
    }

    try {
      const entryFeeBigInt = parseEther(entryFee);
      createPool(poolId, entryFeeBigInt, durationSeconds);
    } catch (err) {
      console.error('Create pool failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create pool');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-background font-orbitron font-bold"
          disabled={!isConnected}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Pool
        </Button>
      </DialogTrigger>

      <DialogContent className="glass-card border-2 border-primary/30 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Create New Prediction Pool
          </DialogTitle>
          <DialogDescription className="font-poppins text-muted-foreground">
            Set up a new prediction pool for others to join
          </DialogDescription>
        </DialogHeader>

        {!isConnected && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive font-poppins">
              ⚠️ Please connect your wallet to create a pool
            </p>
          </div>
        )}

        <div className="space-y-4 mt-4">
          {/* Pool ID */}
          <div className="space-y-2">
            <Label htmlFor="poolId" className="font-poppins text-foreground">
              Pool ID *
            </Label>
            <Input
              id="poolId"
              placeholder="COSMIC-STRIKE-001"
              value={poolId}
              onChange={(e) => setPoolId(e.target.value.toUpperCase())}
              disabled={isPending || isConfirming || isSuccess}
              className="font-orbitron"
            />
            <p className="text-xs text-muted-foreground font-poppins">
              Unique identifier for your pool (e.g., COSMIC-STRIKE-001)
            </p>
          </div>

          {/* Entry Fee */}
          <div className="space-y-2">
            <Label htmlFor="entryFee" className="font-poppins text-foreground">
              Entry Fee (ETH) *
            </Label>
            <Input
              id="entryFee"
              type="number"
              placeholder={MIN_ENTRY_FEE}
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              min={MIN_ENTRY_FEE}
              step="0.0001"
              disabled={isPending || isConfirming || isSuccess}
              className="font-rajdhani"
            />
            <p className="text-xs text-muted-foreground font-poppins">
              Minimum: {MIN_ENTRY_FEE} ETH
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="font-poppins text-foreground">
              Duration (Hours) *
            </Label>
            <Input
              id="duration"
              type="number"
              placeholder="24"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              min="1"
              max="720"
              step="1"
              disabled={isPending || isConfirming || isSuccess}
              className="font-rajdhani"
            />
            <p className="text-xs text-muted-foreground font-poppins">
              Pool will lock after this duration (1-720 hours / up to 30 days)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-poppins">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && hash && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
                <p className="text-sm text-success font-poppins font-semibold">
                  Pool created successfully!
                </p>
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline block font-poppins"
              >
                View on Etherscan →
              </a>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isConnected || isPending || isConfirming || isSuccess}
            className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-background font-orbitron font-bold text-lg"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isPending ? 'Confirming in Wallet...' : 'Creating Pool...'}
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Success!
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Create Pool
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
