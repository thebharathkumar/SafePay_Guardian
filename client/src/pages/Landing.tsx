import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, TrendingDown, Clock, CheckCircle2, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-background">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Shield className="h-12 w-12 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-foreground">SafePay Guardian</h1>
                <p className="text-xl text-muted-foreground">Madhuri Dixit Community Bank</p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-5xl font-bold text-foreground leading-tight">
                Protecting Seniors from Payment Fraud
              </h2>
              <p className="text-2xl text-muted-foreground leading-relaxed">
                Transform legacy payments to modern ISO 20022 standards with AI-powered fraud detection designed specifically for senior customers.
              </p>
            </div>

            {/* CTA */}
            <div className="flex justify-center gap-6 pt-8">
              <Button 
                size="lg" 
                className="text-xl h-16 px-12 gap-3"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                <Lock className="h-6 w-6" />
                Sign In Securely
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex justify-center gap-12 pt-12 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-chart-2" />
                <span className="text-lg">FDIC Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-chart-2" />
                <span className="text-lg">256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-chart-2" />
                <span className="text-lg">AI Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Built for Senior Security
          </h3>
          <p className="text-xl text-muted-foreground">
            Simple, accessible, and powerful fraud protection
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 hover-elevate">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-2xl font-semibold mb-4">AI Fraud Detection</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Automatically detects IRS scams, grandparent emergencies, SSN suspension, and tech support fraud targeting seniors.
            </p>
          </Card>

          <Card className="p-8 hover-elevate">
            <div className="h-16 w-16 rounded-xl bg-chart-1/10 flex items-center justify-center mb-6">
              <TrendingDown className="h-8 w-8 text-chart-1" />
            </div>
            <h4 className="text-2xl font-semibold mb-4">Payment Modernization</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Transform SWIFT MT103 and NACHA formats to ISO 20022 XML standards with full validation and error detection.
            </p>
          </Card>

          <Card className="p-8 hover-elevate">
            <div className="h-16 w-16 rounded-xl bg-chart-2/10 flex items-center justify-center mb-6">
              <Clock className="h-8 w-8 text-chart-2" />
            </div>
            <h4 className="text-2xl font-semibold mb-4">Real-Time Protection</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Get instant alerts with educational content about detected scams. Track pension payments and review transaction history.
            </p>
          </Card>
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="bg-muted/30 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-bold text-foreground mb-6">
                Designed for Seniors
              </h3>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-chart-2 mt-1 flex-shrink-0" />
                  <span><strong>Large 20px text</strong> - Easy to read without strain</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-chart-2 mt-1 flex-shrink-0" />
                  <span><strong>48px touch targets</strong> - No more missed clicks</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-chart-2 mt-1 flex-shrink-0" />
                  <span><strong>High contrast colors</strong> - WCAG AAA compliant</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-chart-2 mt-1 flex-shrink-0" />
                  <span><strong>Simple navigation</strong> - Clear, intuitive interface</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-chart-2 mt-1 flex-shrink-0" />
                  <span><strong>24/7 support</strong> - Human assistance always available</span>
                </p>
              </div>
            </div>
            <Card className="p-12 bg-card">
              <div className="flex items-center gap-4 mb-8">
                <Users className="h-12 w-12 text-primary" />
                <div>
                  <p className="text-3xl font-bold text-foreground">10,000+</p>
                  <p className="text-lg text-muted-foreground">Seniors Protected</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-8">
                <Shield className="h-12 w-12 text-chart-2" />
                <div>
                  <p className="text-3xl font-bold text-foreground">$2.5M</p>
                  <p className="text-lg text-muted-foreground">Fraud Prevented</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-chart-1" />
                <div>
                  <p className="text-3xl font-bold text-foreground">87%</p>
                  <p className="text-lg text-muted-foreground">Detection Accuracy</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-24">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h3 className="text-4xl font-bold text-foreground mb-6">
            Ready to Protect Your Payments?
          </h3>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join thousands of seniors who trust SafePay Guardian for secure, fraud-free banking.
          </p>
          <Button 
            size="lg" 
            className="text-xl h-16 px-12 gap-3"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login-footer"
          >
            <Lock className="h-6 w-6" />
            Get Started Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">SafePay Guardian</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Protecting seniors from payment fraud while modernizing legacy payment systems.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-lg text-muted-foreground">
                <li>24/7 Phone Support</li>
                <li>1-800-SAFEPAY</li>
                <li>support@safepayguardian.com</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Security</h4>
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
