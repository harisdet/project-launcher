import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import CustomersPage from "./pages/Customers";
import VehiclesPage from "./pages/Vehicles";
import JobCardsPage from "./pages/JobCards";
import JobCardDetailPage from "./pages/JobCardDetail";
import RemindersPage from "./pages/Reminders";
import InvoicePage from "./pages/Invoice";
import CustomerDetailPage from "./pages/CustomerDetail";
import VehicleDetailPage from "./pages/VehicleDetail";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/customers" component={CustomersPage} />
        <Route path="/customers/:id" component={CustomerDetailPage} />
        <Route path="/vehicles" component={VehiclesPage} />
        <Route path="/vehicles/:id" component={VehicleDetailPage} />
        <Route path="/job-cards" component={JobCardsPage} />
        <Route path="/job-cards/:id" component={JobCardDetailPage} />
        <Route path="/job-cards/:id/invoice" component={InvoicePage} />
        <Route path="/reminders" component={RemindersPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
