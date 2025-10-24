import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, TrendingUp, FileText, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Transaction } from "@shared/schema";

export default function Dashboard() {
  const { data: recentTransactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/recent"],
  });

  const { data: stats } = useQuery<{
    totalTransactions: number;
    flaggedTransactions: number;
    averageFraudScore: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const pendingPension = {
    amount: 2847.50,
    source: "Social Security",
    expectedDate: "March 15, 2025",
    status: "In Transit"
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-3" data-testid="text-dashboard-title">
            Welcome to SafePay Guardian
          </h1>
          <p className="text-xl text-muted-foreground">
            Your payments are protected with advanced fraud detection
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Account Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="p-8 shadow-lg hover-elevate rounded-xl" data-testid="card-total-transactions">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-12 w-12 text-primary" />
              <Badge className="text-lg px-4 py-2">Total</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground font-medium">Total Transactions</p>
              <p className="text-4xl font-bold text-foreground">
                {stats?.totalTransactions ?? 0}
              </p>
            </div>
          </Card>

          <Card className="p-8 shadow-lg hover-elevate rounded-xl" data-testid="card-fraud-alerts">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <Badge variant="destructive" className="text-lg px-4 py-2">
                Alerts
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground font-medium">Fraud Alerts</p>
              <p className="text-4xl font-bold text-destructive">
                {stats?.flaggedTransactions ?? 0}
              </p>
            </div>
          </Card>

          <Card className="p-8 shadow-lg hover-elevate rounded-xl" data-testid="card-protection-score">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-12 w-12 text-chart-2" />
              <Badge className="text-lg px-4 py-2 bg-chart-2 text-white">
                Protected
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground font-medium">Protection Score</p>
              <p className="text-4xl font-bold text-chart-2">
                {stats ? `${(100 - stats.averageFraudScore).toFixed(0)}%` : "100%"}
              </p>
            </div>
          </Card>
        </div>

        {/* Pension Tracker */}
        <Card className="p-8 mb-12 shadow-lg rounded-xl" data-testid="card-pension-tracker">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Clock className="h-10 w-10 text-primary" />
              <h2 className="text-2xl font-semibold">Next Pension Payment</h2>
            </div>
            <Badge className="text-lg px-6 py-2 animate-pulse-subtle bg-chart-2 text-white">
              {pendingPension.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-lg text-muted-foreground mb-2 font-medium">Amount</p>
              <p className="text-3xl font-bold text-foreground">
                ${pendingPension.amount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-lg text-muted-foreground mb-2 font-medium">Source</p>
              <p className="text-xl font-semibold text-foreground">
                {pendingPension.source}
              </p>
            </div>
            <div>
              <p className="text-lg text-muted-foreground mb-2 font-medium">Expected</p>
              <p className="text-xl font-semibold text-foreground">
                {pendingPension.expectedDate}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                <div className="bg-chart-2 h-full w-3/4 rounded-full transition-all"></div>
              </div>
              <span className="ml-6 text-lg font-medium text-muted-foreground">
                75% Complete
              </span>
            </div>
            <div className="flex justify-between mt-4 text-lg text-muted-foreground">
              <span>Sent</span>
              <span>Received</span>
              <span>Cleared</span>
              <span className="font-semibold text-foreground">Available</span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Link href="/transform" data-testid="link-transform-payment">
            <Card className="p-12 shadow-lg hover-elevate active-elevate-2 cursor-pointer rounded-xl transition-all">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3">Transform Payment</h3>
                  <p className="text-lg text-muted-foreground">
                    Convert MT103 or NACHA to ISO 20022 format
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/history" data-testid="link-transaction-history">
            <Card className="p-12 shadow-lg hover-elevate active-elevate-2 cursor-pointer rounded-xl transition-all">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="h-24 w-24 rounded-full bg-secondary/10 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3">View History</h3>
                  <p className="text-lg text-muted-foreground">
                    Review all your payment transformations
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="p-8 shadow-lg rounded-xl" data-testid="card-recent-activity">
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Recent Transactions
          </h2>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-6">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-6 border border-border rounded-lg hover-elevate"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-foreground mb-2">
                      {transaction.recipientName || "Unknown Recipient"}
                    </p>
                    <p className="text-lg text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        ${transaction.amount.toFixed(2)}
                      </p>
                      <Badge
                        variant={transaction.fraudFlag ? "destructive" : "default"}
                        className="text-lg px-3 py-1 mt-2"
                      >
                        {transaction.fraudFlag
                          ? `Risk: ${transaction.fraudScore}%`
                          : "Verified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
              <p className="text-xl text-muted-foreground">No transactions yet</p>
              <p className="text-lg text-muted-foreground mt-3 mb-8">
                Start by transforming your first payment
              </p>
              <Link href="/transform">
                <Button size="lg" className="text-lg px-8 py-6">
                  Transform Payment
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
