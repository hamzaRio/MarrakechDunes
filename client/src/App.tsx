import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SecurityProvider } from "@/hooks/use-security";
import SecurityWrapper from "@/components/security-wrapper";
import Home from "@/pages/home";
import Activities from "@/pages/activities";
import Booking from "@/pages/booking-new";
import Reviews from "@/pages/reviews";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import CEODashboard from "@/pages/admin/ceo-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public pages with basic security */}
      <Route path="/" component={() => (
        <SecurityWrapper showSecurityStatus={false} enableThreatDetection={true}>
          <Home />
        </SecurityWrapper>
      )} />
      
      <Route path="/activities" component={() => (
        <SecurityWrapper showSecurityStatus={false} enableThreatDetection={true}>
          <Activities />
        </SecurityWrapper>
      )} />
      
      <Route path="/reviews" component={() => (
        <SecurityWrapper showSecurityStatus={false} enableThreatDetection={true}>
          <Reviews />
        </SecurityWrapper>
      )} />
      
      {/* Booking page with enhanced security */}
      <Route path="/booking" component={() => (
        <SecurityWrapper 
          showSecurityStatus={true} 
          enableThreatDetection={true}
          requireSecureConnection={false}
        >
          <Booking />
        </SecurityWrapper>
      )} />
      
      {/* Admin pages with maximum security */}
      <Route path="/admin/login" component={() => (
        <SecurityWrapper 
          showSecurityStatus={true} 
          enableThreatDetection={true}
          requireSecureConnection={false}
        >
          <AdminLogin />
        </SecurityWrapper>
      )} />
      
      <Route path="/admin/ceo" component={() => (
        <SecurityWrapper 
          showSecurityStatus={true} 
          enableThreatDetection={true}
          requireSecureConnection={false}
        >
          <CEODashboard />
        </SecurityWrapper>
      )} />
      
      <Route path="/admin/dashboard" component={() => (
        <SecurityWrapper 
          showSecurityStatus={true} 
          enableThreatDetection={true}
          requireSecureConnection={false}
        >
          <AdminDashboard />
        </SecurityWrapper>
      )} />
      
      <Route path="/admin" component={() => (
        <SecurityWrapper 
          showSecurityStatus={true} 
          enableThreatDetection={true}
          requireSecureConnection={false}
        >
          <AdminDashboard />
        </SecurityWrapper>
      )} />
      
      {/* 404 page */}
      <Route component={() => (
        <SecurityWrapper showSecurityStatus={false} enableThreatDetection={false}>
          <NotFound />
        </SecurityWrapper>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SecurityProvider>
        <TooltipProvider>
          <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
            rel="stylesheet"
          />
          <Toaster />
          <Router />
        </TooltipProvider>
      </SecurityProvider>
    </QueryClientProvider>
  );
}

export default App;
