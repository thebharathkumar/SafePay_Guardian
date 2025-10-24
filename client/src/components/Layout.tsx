import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Shield, LayoutDashboard, ArrowLeftRight, History, BarChart3, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SupportWidget from "./SupportWidget";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/senior", label: "Senior View", icon: User },
    { href: "/transform", label: "Transform", icon: ArrowLeftRight },
    { href: "/history", label: "History", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" data-testid="link-home">
              <div className="flex items-center gap-3 hover-elevate px-4 py-2 rounded-lg cursor-pointer">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">SafePay Guardian</h1>
                  <p className="text-lg text-muted-foreground">MDCB Security</p>
                </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="lg"
                      className="text-lg h-14 px-6 gap-3"
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.email || "User"} style={{ objectFit: 'cover' }} />
                    <AvatarFallback className="text-lg">
                      {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-lg font-semibold text-foreground">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.email}
                    </p>
                    <p className="text-base text-muted-foreground">Account</p>
                  </div>
                </div>
              )}
              <Button
                size="lg"
                variant="outline"
                className="text-lg h-14 px-6 gap-3"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2 pb-4 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="lg"
                    className="text-lg h-12 px-4 gap-2 whitespace-nowrap"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* Support Widget */}
      <SupportWidget />

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-24">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">SafePay Guardian</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Protecting seniors from payment fraud while modernizing legacy payment systems.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-3 text-lg text-muted-foreground">
                <li>24/7 Phone Support</li>
                <li>1-800-SAFEPAY</li>
                <li>support@safepayguardian.com</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Security</h3>
              <ul className="space-y-3 text-lg text-muted-foreground">
                <li>FDIC Insured</li>
                <li>256-bit Encryption</li>
                <li>AI Fraud Detection</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-lg text-muted-foreground">
            <p>© 2025 Madhuri Dixit Community Bank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
