import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Mountain, Menu, MapPin, Phone, Globe, LogOut, User } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();
  const { user } = useAuth();
  const displayName = user?.username ?? t("admin.userPlaceholder");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      console.log('[NAVBAR] Starting logout process...');
      
      // Call server logout
      await logout();
      
      // Clear all client-side state
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: ["/auth/user"] });
      queryClient.clear();
      
      toast({
        title: "✅ Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if server logout fails, clear client state
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      sessionStorage.clear();
      queryClient.clear();
      
      toast({
        title: "⚠️ Déconnexion",
        description: "Déconnexion locale effectuée",
      });
      
      // Force page reload
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  const navItems = [
    { href: "/", label: t('nav.home') },
    { href: "/activities", label: t('nav.activities') },
    { href: "/booking", label: t('nav.booking') },
    { href: "/reviews", label: t('nav.reviews') },
    { href: "/admin/login", label: t('nav.admin') },
  ];

  // Add admin dashboard link if user is authenticated and has admin role
  // Only show admin links if user is properly authenticated
  const isAuthenticated = user && (user.role === 'admin' || user.role === 'superadmin');
  if (isAuthenticated) {
    navItems.push({ href: "/admin/dashboard", label: t('nav.adminDashboard') });
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Mountain className="text-moroccan-red text-2xl mr-2" />
              <span className="font-playfair text-xl font-bold text-moroccan-blue">
                MarrakechDunes
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`text-gray-700 hover:text-moroccan-red transition-colors cursor-pointer ${
                    location === item.href ? "text-moroccan-red font-medium" : ""
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-moroccan-blue text-moroccan-blue hover:bg-moroccan-blue hover:text-white">
                  <Globe className="w-4 h-4 mr-2" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("fr")}>
                  Francais
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Menu for authenticated users */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-gray-100">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="flex items-center w-full">
                      <User className="h-4 w-4 mr-2" />
                      {t('nav.adminDashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('admin.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center">
                    <Mountain className="text-moroccan-red mr-2" />
                    <span className="font-playfair text-moroccan-blue">MarrakechDunes</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={`text-lg hover:text-moroccan-red transition-colors cursor-pointer p-2 rounded ${
                          location === item.href ? "text-moroccan-red bg-moroccan-sand" : ""
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </div>
                    </Link>
                  ))}
                  {/* Only show admin access if user is authenticated and has admin role */}
                  {user && (user.role === 'admin' || user.role === 'superadmin') && (
                    <div className="border-t pt-4 mt-4 space-y-2">
                      <div className="text-sm text-gray-600 mb-2">
                        Logged in as: <span className="font-semibold">{displayName}</span>
                      </div>
                      <Link href="/admin/dashboard">
                        <div
                          className="text-lg hover:text-moroccan-red transition-colors cursor-pointer p-2 rounded"
                          onClick={() => setIsOpen(false)}
                        >
                          {t('admin.adminAccess')}
                        </div>
                      </Link>
                      <div
                        className="text-lg hover:text-red-600 transition-colors cursor-pointer p-2 rounded flex items-center"
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('admin.logout')}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-moroccan-red mr-3" />
                      <span className="text-sm">54 Riad Zitoun Lakdim, Marrakech</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-moroccan-red mr-3" />
                      <span className="text-sm">WhatsApp Available</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

