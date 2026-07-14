import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import HomePage from "@/pages/HomePage";
import ContractPage from "@/pages/ContractPage";
import AdminPage from "@/pages/AdminPage";
import SetupPage from "@/pages/SetupPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type SetupStatus = "loading" | "needs-setup" | "ready";

function AppContent() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>("loading");
  const [, navigate] = useLocation();

  useEffect(() => {
    const check = (attempt: number) => {
      fetch(`/api/setup/status`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<{ needsSetup: boolean }>;
        })
        .then((d) => setSetupStatus(d.needsSetup ? "needs-setup" : "ready"))
        .catch(() => {
          // Retry once after 1s before falling back to needs-setup
          if (attempt < 2) {
            setTimeout(() => check(attempt + 1), 1000);
          } else {
            setSetupStatus("needs-setup");
          }
        });
    };
    check(0);
  }, []);

  const handleSetupComplete = (token: string) => {
    if (token) {
      localStorage.setItem("tac_admin_token", token);
    }
    setSetupStatus("ready");
    if (token) navigate("/admin");
  };

  if (setupStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (setupStatus === "needs-setup") {
    return <SetupPage onComplete={handleSetupComplete} />;
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/contratar" component={ContractPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={BASE}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
