import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc, transformer } from "@/lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import Machines from "./pages/Machines";
import DashboardLayout from "@/components/DashboardLayout";
import EmployeePortal from "./pages/EmployeePortal";
import Schedule from "./pages/Schedule";
import NotificationsPage from "./pages/Notifications";
import Settings from "./pages/Settings";                    // ← NEU

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/"}>
        <ProtectedRoute component={Home} />
      </Route>
      <Route path={"/mitarbeiter"}>
        <ProtectedRoute component={Employees} />
      </Route>
      <Route path={"/maschinen"}>
        <ProtectedRoute component={Machines} />
      </Route>
      <Route path={"/schichtplan"}>
        <ProtectedRoute component={Schedule} />
      </Route>
      <Route path={"/me"}>
        <ProtectedRoute component={EmployeePortal} />
      </Route>
      <Route path={"/settings"}>
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path={"/alle-benachrichtigungen"}>
        <ProtectedRoute component={NotificationsPage} />
      </Route>
      <Route path={"/settings"}>
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:3000/api/trpc",
        transformer,
      }),
    ],
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="light" switchable>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
}