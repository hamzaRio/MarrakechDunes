import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SecurityProvider } from "@/hooks/use-security";
import { LanguageProvider } from "@/hooks/use-language";
import SecurityWrapper from "@/components/security-wrapper";
import Home from "@/pages/home";
import Activities from "@/pages/activities";
import Booking from "@/pages/booking-fixed";
import Reviews from "@/pages/reviews";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import CEODashboard from "@/pages/admin/ceo-dashboard";
import PerformanceDashboard from "@/pages/admin/performance-dashboard";
import AdminAccessGuide from "@/components/admin-access-guide";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public pages with minimal security for clean experience */}
      <Route path="/" component={() => (
        <SecurityWrapper showSecurityStatus={false} enableThreatDetection={false}>
          <Home />
        </SecurityWrapper>
      )} />
      
      <Route path="/activities" component={() => (
        <SecurityWrapper showSecurityStatus={false} enableThreatDetection={false}>
          <Activities />
        </SecurityWrapper>
      )} />
      
      <Route path="/reviews" component={() => (
        <SecurityWrapper showSecurityStatus={false} enableThreatDetection={false}>
          <Reviews />
        </SecurityWrapper>
      )} />
      
      {/* Booking page with minimal security for development */}
      <Route path="/booking" component={() => (
        <SecurityWrapper 
          showSecurityStatus={false} 
          enableThreatDetection={false}
          requireSecureConnection={false}
          logPageView={false}
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
      
      <Route path="/admin/performance" component={() => (
        <SecurityWrapper 
          showSecurityStatus={true} 
          enableThreatDetection={true}
          requireSecureConnection={false}
        >
          <PerformanceDashboard />
        </SecurityWrapper>
      )} />
      
      <Route path="/admin/access-guide" component={() => (
        <SecurityWrapper 
          showSecurityStatus={false} 
          enableThreatDetection={false}
          requireSecureConnection={false}
        >
          <AdminAccessGuide />
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
        <LanguageProvider>
          <TooltipProvider>
            <link
              href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
              rel="stylesheet"
            />
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </SecurityProvider>
    </QueryClientProvider>
  );
}

export default App;
