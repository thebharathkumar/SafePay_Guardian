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
    </div>
  );
}
