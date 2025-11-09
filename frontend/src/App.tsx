import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import CosmicBackground from "@/components/CosmicBackground";
import Index from "./pages/Index";
import Predictions from "./pages/Predictions";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen w-full cosmic-bg relative overflow-hidden">
          <CosmicBackground />

          <div className="flex min-h-screen w-full relative z-10">
            <main className="flex-1 p-4 md:p-8 overflow-auto">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            <AppSidebar />
          </div>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
