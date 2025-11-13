import { Settings as SettingsIcon, Bell, Shield, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-primary neon-glow-primary">
          Settings
        </h1>
        <p className="text-muted-foreground font-poppins">
          Customize your experience
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Notifications */}
      <Card className="glass-card p-6 border-2 border-border">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-accent" />
          <h3 className="text-xl font-orbitron font-bold">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-poppins font-medium">Pool Results</p>
              <p className="text-sm text-muted-foreground">Get notified when pools are settled</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-poppins font-medium">New Pools</p>
              <p className="text-sm text-muted-foreground">Alert for new prediction pools</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card className="glass-card p-6 border-2 border-border">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-secondary" />
          <h3 className="text-xl font-orbitron font-bold">Privacy & Security</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-poppins font-medium">FHE Encryption</p>
              <p className="text-sm text-muted-foreground">Encrypt bet weights (recommended)</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-poppins font-medium">Public Profile</p>
              <p className="text-sm text-muted-foreground">Show stats on leaderboard</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="glass-card p-6 border-2 border-border">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-orbitron font-bold">Appearance</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-poppins font-medium">Animations</p>
              <p className="text-sm text-muted-foreground">Enable visual effects</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-poppins font-medium">Particle Effects</p>
              <p className="text-sm text-muted-foreground">Show background particles</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
