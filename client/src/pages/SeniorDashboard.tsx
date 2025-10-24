import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Bell, CheckCircle2, AlertTriangle, DollarSign, Calendar } from "lucide-react";
import { format, addMonths } from "date-fns";
import type { Transaction } from "@shared/schema";

export default function SeniorDashboard() {
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/recent"],
  });

  // Calculate pension balance (mock data for now)
  const pensionBalance = 2850.00;
  const nextPaymentDate = addMonths(new Date(), 1);
  const nextPaymentAmount = 2850.00;

  // Recent transactions
  const recentActivity = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-5xl font-bold text-foreground mb-3" data-testid="text-dashboard-title">
          Your Account
        </h1>
        <p className="text-2xl text-muted-foreground">
          Welcome back! Here's your account overview
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Balance Card */}
        <Card className="p-8 border-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-2xl text-muted-foreground mb-2">Account Balance</p>
              <p className="text-6xl font-bold text-foreground" data-testid="text-balance">
                ${pensionBalance.toLocaleString()}
              </p>
            </div>
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-10 w-10 text-primary" />
            </div>
          </div>
          <Badge className="bg-green-600 text-white text-lg px-6 py-2" data-testid="badge-pension-status">
            ✅ Pension deposited 2 hours ago
          </Badge>
        </Card>

        {/* Next Payment Card */}
        <Card className="p-8 border-2">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-blue-600/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-next-payment-title">
                Next Expected Payment
              </h2>
              <div className="flex items-baseline gap-4 mb-3">
                <p className="text-5xl font-bold text-foreground" data-testid="text-next-payment-amount">
                  ${nextPaymentAmount.toLocaleString()}
                </p>
                <p className="text-2xl text-muted-foreground">
                  on {format(nextPaymentDate, 'MMMM d, yyyy')}
                </p>
              </div>
              <p className="text-xl text-muted-foreground">
                Your Social Security payment will arrive automatically
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-8 border-2">
          <h2 className="text-3xl font-bold text-foreground mb-6" data-testid="text-recent-activity-title">
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-6 p-6 bg-muted/30 rounded-lg border border-border"
                  data-testid={`activity-item-${transaction.id}`}
                >
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.fraudFlag 
                      ? 'bg-destructive/10' 
                      : 'bg-green-600/10'
                  }`}>
                    {transaction.fraudFlag ? (
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-semibold text-foreground mb-1">
                      ${transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xl text-muted-foreground">
                      {transaction.recipientName || transaction.remittanceInfo || 'Payment'}
                    </p>
                    <p className="text-lg text-muted-foreground mt-1">
                      {format(new Date(transaction.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    {transaction.fraudFlag ? (
                      <Badge variant="destructive" className="text-lg px-4 py-2">
                        ⚠️ Review Needed
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-lg px-4 py-2 bg-green-600 text-white">
                        ✅ Completed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-2xl text-muted-foreground">
                No recent activity to display
              </p>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button
            size="lg"
            className="h-20 text-2xl font-semibold bg-destructive hover:bg-destructive/90"
            data-testid="button-view-alerts"
          >
            <Bell className="h-8 w-8 mr-4" />
            View Fraud Alerts
          </Button>
          <Button
            size="lg"
            className="h-20 text-2xl font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-call-bank"
          >
            <Phone className="h-8 w-8 mr-4" />
            📞 Call Bank Now
          </Button>
        </div>

        {/* Help Card */}
        <Card className="p-8 bg-primary/5 border-2 border-primary">
          <div className="flex items-start gap-6">
            <Phone className="h-12 w-12 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-3xl font-bold text-foreground mb-3">
                Need Help?
              </h3>
              <p className="text-xl text-foreground mb-4 leading-relaxed">
                Our customer service team is available 24/7 to assist you with any questions
                or concerns about your account.
              </p>
              <p className="text-3xl font-bold text-primary">
                1-800-MDCB-BANK (1-800-632-2226)
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
