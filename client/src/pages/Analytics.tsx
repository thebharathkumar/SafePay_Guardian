import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Download, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Transaction } from "@shared/schema";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = {
  primary: "hsl(var(--primary))",
  destructive: "hsl(var(--destructive))",
  chart1: "hsl(var(--chart-1))",
  chart2: "hsl(var(--chart-2))",
  chart3: "hsl(var(--chart-3))",
  chart4: "hsl(var(--chart-4))",
  chart5: "hsl(var(--chart-5))",
};

export default function Analytics() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  const fraudulentTxns = transactions?.filter(t => t.fraudFlag) || [];
  const safeTxns = transactions?.filter(t => !t.fraudFlag) || [];
  const mt103Count = transactions?.filter(t => t.sourceFormat === "MT103").length || 0;
  const nachaCount = transactions?.filter(t => t.sourceFormat === "NACHA").length || 0;
  
  // Group by fraud type for pie chart
  const scamTypes: Record<string, number> = {};
  fraudulentTxns.forEach(tx => {
    if (tx.fraudType) {
      scamTypes[tx.fraudType] = (scamTypes[tx.fraudType] || 0) + 1;
    }
  });

  const scamPieData = Object.entries(scamTypes).map(([name, value]) => ({ name, value }));

  // Fraud trend over last 7 days (line chart)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dateStr = format(date, "yyyy-MM-dd");
    const dayTxns = transactions?.filter(t => 
      format(new Date(t.timestamp), "yyyy-MM-dd") === dateStr
    ) || [];
    const fraudCount = dayTxns.filter(t => t.fraudFlag).length;
    const avgScore = dayTxns.length > 0
      ? Math.round(dayTxns.reduce((sum, t) => sum + (t.fraudScore || 0), 0) / dayTxns.length)
      : 0;

    return {
      date: format(date, "MMM dd"),
      fraudCount,
      avgScore,
      total: dayTxns.length
    };
  });

  // Format volume bar chart data
  const formatVolumeData = [
    { format: "SWIFT MT103", count: mt103Count, fill: COLORS.primary },
    { format: "NACHA CCD", count: nachaCount, fill: COLORS.chart1 },
  ];

  const detectionRate = transactions && transactions.length > 0
    ? Math.round((fraudulentTxns.length / transactions.length) * 100)
    : 0;

  const avgFraudScore = transactions && transactions.length > 0
    ? Math.round(transactions.reduce((sum, t) => sum + (t.fraudScore || 0), 0) / transactions.length)
    : 0;

  const downloadCSV = () => {
    if (!transactions) return;

    const headers = ["Transaction ID", "Date", "Amount", "Format", "Fraud Score", "Fraud Flag", "Fraud Type", "Status"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(tx => [
        tx.transactionId,
        new Date(tx.timestamp).toISOString(),
        tx.amount,
        tx.sourceFormat,
        tx.fraudScore || 0,
        tx.fraudFlag ? "Yes" : "No",
        tx.fraudType || "",
        tx.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Fraud Analytics</h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive fraud detection insights and trends
          </p>
        </div>
        <Button
          size="lg"
          className="text-lg h-14 px-6 gap-3"
          onClick={downloadCSV}
          data-testid="button-download-csv"
        >
          <Download className="h-5 w-5" />
          Download Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground mb-2">Total Transactions</p>
          <p className="text-4xl font-bold text-foreground" data-testid="metric-total-transactions">{transactions?.length || 0}</p>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground mb-2">Fraud Detected</p>
          <p className="text-4xl font-bold text-destructive" data-testid="metric-fraud-detected">{fraudulentTxns.length}</p>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-chart-2" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground mb-2">Detection Rate</p>
          <p className="text-4xl font-bold text-chart-2" data-testid="metric-detection-rate">{detectionRate}%</p>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-chart-1" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground mb-2">Avg Risk Score</p>
          <p className="text-4xl font-bold text-chart-1" data-testid="metric-avg-score">{avgFraudScore}</p>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Fraud Trend Line Chart */}
        <Card className="p-8">
          <h3 className="text-2xl font-semibold mb-6">Fraud Detection Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '14px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '14px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Line 
                type="monotone" 
                dataKey="fraudCount" 
                stroke={COLORS.destructive}
                strokeWidth={3}
                name="Fraud Count"
                dot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="avgScore" 
                stroke={COLORS.chart1}
                strokeWidth={3}
                name="Avg Score"
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Transaction Volume by Format Bar Chart */}
        <Card className="p-8">
          <h3 className="text-2xl font-semibold mb-6">Transaction Volume by Format</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="format" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '14px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '14px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
              <Bar dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Scam Types Pie Chart */}
        <Card className="p-8">
          <h3 className="text-2xl font-semibold mb-6">Detected Scam Types Breakdown</h3>
          {scamPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scamPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scamPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={[COLORS.destructive, COLORS.chart3, COLORS.chart4, COLORS.chart5][index % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-lg text-muted-foreground">No fraud detected - excellent!</p>
            </div>
          )}
        </Card>

        {/* Status Breakdown */}
        <Card className="p-8">
          <h3 className="text-2xl font-semibold mb-6">Transaction Status Overview</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 rounded-lg bg-chart-2/10">
              <p className="text-4xl font-bold text-chart-2 mb-2">
                {safeTxns.length}
              </p>
              <p className="text-lg text-muted-foreground">Safe & Approved</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-warning/10">
              <p className="text-4xl font-bold text-warning mb-2">
                {transactions?.filter(t => t.status === "reviewing").length || 0}
              </p>
              <p className="text-lg text-muted-foreground">Under Review</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-destructive/10">
              <p className="text-4xl font-bold text-destructive mb-2">
                {transactions?.filter(t => t.status === "blocked").length || 0}
              </p>
              <p className="text-lg text-muted-foreground">Blocked</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <p className="text-4xl font-bold text-muted-foreground mb-2">
                {transactions?.filter(t => t.status === "pending").length || 0}
              </p>
              <p className="text-lg text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cost Savings Calculator */}
      <Card className="p-8 bg-primary/5 border-primary/20">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-3 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            ISO 20022 Cost Savings Calculator
          </h2>
          <p className="text-xl text-muted-foreground">
            Annual cost comparison for 1,000 monthly transactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Legacy Costs */}
          <div className="bg-destructive/10 rounded-lg p-6 border-2 border-destructive/30" data-testid="card-legacy-costs">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Legacy Systems</h3>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-xl">
                <span className="text-muted-foreground">SWIFT MT103 Fees:</span>
                <span className="font-semibold" data-testid="text-mt103-fees">$42,000</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-muted-foreground">NACHA Processing:</span>
                <span className="font-semibold" data-testid="text-nacha-fees">$28,500</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-muted-foreground">Manual Reviews:</span>
                <span className="font-semibold" data-testid="text-manual-fees">$14,900</span>
              </div>
              <div className="h-px bg-destructive/30 my-4" />
              <div className="flex justify-between text-2xl font-bold">
                <span className="text-foreground">Annual Total:</span>
                <span className="text-destructive" data-testid="text-legacy-total">$85,400</span>
              </div>
            </div>
          </div>

          {/* ISO 20022 Costs */}
          <div className="bg-chart-2/10 rounded-lg p-6 border-2 border-chart-2/30" data-testid="card-iso-costs">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-lg bg-chart-2/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">ISO 20022</h3>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-xl">
                <span className="text-muted-foreground">Processing Fees:</span>
                <span className="font-semibold" data-testid="text-iso-processing">$1,200</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-muted-foreground">AI Fraud Detection:</span>
                <span className="font-semibold" data-testid="text-ai-fees">$1,800</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-muted-foreground">Platform Maintenance:</span>
                <span className="font-semibold" data-testid="text-platform-fees">$585</span>
              </div>
              <div className="h-px bg-chart-2/30 my-4" />
              <div className="flex justify-between text-2xl font-bold">
                <span className="text-foreground">Annual Total:</span>
                <span className="text-chart-2" data-testid="text-iso-total">$3,585</span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Bar Chart */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-6">Cost Comparison Visualization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                { name: 'Legacy Systems', cost: 85400, fill: COLORS.destructive },
                { name: 'ISO 20022', cost: 3585, fill: COLORS.chart2 }
              ]}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '16px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                dataKey="name"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '16px' }}
                width={150}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Bar dataKey="cost" radius={[0, 8, 8, 0]}>
                {[0, 1].map((index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={index === 0 ? COLORS.destructive : COLORS.chart2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings Summary */}
        <div className="bg-primary/10 rounded-lg p-8 border-2 border-primary/30" data-testid="card-savings-summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-xl text-muted-foreground mb-2">Annual Savings</p>
              <p className="text-5xl font-bold text-primary" data-testid="text-annual-savings">
                $81,815
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl text-muted-foreground mb-2">Cost Reduction</p>
              <p className="text-5xl font-bold text-primary" data-testid="text-cost-reduction">
                96%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl text-muted-foreground mb-2">ROI Timeline</p>
              <p className="text-5xl font-bold text-primary" data-testid="text-roi-timeline">
                &lt; 3 mo
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xl text-muted-foreground">
              SafePay Guardian delivers enterprise-grade fraud protection at a fraction of traditional costs
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
