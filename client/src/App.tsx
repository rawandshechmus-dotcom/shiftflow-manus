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
      <Route path={"/mitarbeiter"}>
        <ProtectedRoute component={Employees} />
      </Route>
      <Route path={"/maschinen"}>
        <ProtectedRoute component={Machines} />
      </Route>
      <Route path={"/"}>
        <ProtectedRoute component={Home} />
      </Route>
      <Route path={"/me"}>
        <ProtectedRoute component={EmployeePortal} />
      </Route>
      <Route path={"/schichtplan"}>
        <ProtectedRoute component={Schedule} />
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;