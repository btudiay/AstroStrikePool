import { Home, Trophy, User, Settings, Sparkles } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'My Predictions', url: '/predictions', icon: Trophy },
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar 
      side="right"
      className="border-l-2 border-l-primary/30 bg-sidebar"
      collapsible="icon"
    >
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            {open && (
              <div>
                <h2 className="font-orbitron font-bold text-lg text-primary neon-glow-primary">
                  AstroStrike
                </h2>
                <p className="text-xs text-muted-foreground font-poppins">
                  Cosmic Casino
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="font-orbitron text-primary">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-primary/10 font-poppins transition-all duration-300"
                      activeClassName="bg-primary/20 text-primary border-l-4 border-l-primary"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Stats Section */}
        {open && (
          <div className="mt-auto p-6 border-t border-border space-y-4">
            <div className="glass-card p-4 rounded-xl">
              <p className="text-xs text-muted-foreground font-poppins mb-2">
                Total Volume
              </p>
              <p className="text-2xl font-rajdhani font-bold text-primary">
                1,234.5 ETH
              </p>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-xs text-muted-foreground font-poppins mb-2">
                Active Pools
              </p>
              <p className="text-2xl font-rajdhani font-bold text-accent">
                42
              </p>
            </div>
          </div>
        )}
      </SidebarContent>

      {/* Toggle Button */}
      <div className="absolute top-4 -left-12">
        <SidebarTrigger className="glass-card hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-300" />
      </div>
    </Sidebar>
  );
}
