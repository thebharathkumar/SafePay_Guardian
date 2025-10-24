import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Filter, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const filteredTransactions = transactions?.filter((tx) => {
    const matchesSearch =
      !searchTerm ||
      tx.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.remittanceInfo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFormat =
      filterFormat === "all" || tx.sourceFormat === filterFormat;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "flagged" && tx.fraudFlag) ||
      (filterStatus === "safe" && !tx.fraudFlag);

    return matchesSearch && matchesFormat && matchesStatus;
  });

  const downloadXML = (transaction: Transaction) => {
    if (!transaction.iso20022Xml) return;

    const blob = new Blob([transaction.iso20022Xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${transaction.transactionId}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-3" data-testid="text-history-title">
            Transaction History
          </h1>
          <p className="text-xl text-muted-foreground">
            View and manage all your payment transformations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Filters */}
        <Card className="p-8 mb-8 shadow-lg rounded-xl" data-testid="card-filters">
          <div className="flex items-center gap-4 mb-6">
            <Filter className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-semibold">Filter Transactions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="search" className="text-lg font-medium mb-3 block">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 text-lg h-14"
                  data-testid="input-search"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="format-filter" className="text-lg font-medium mb-3 block">
                Format
              </Label>
              <Select value={filterFormat} onValueChange={setFilterFormat}>
                <SelectTrigger className="text-lg h-14" id="format-filter" data-testid="select-format">
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="MT103">SWIFT MT103</SelectItem>
                  <SelectItem value="NACHA">NACHA CCD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter" className="text-lg font-medium mb-3 block">
                Status
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="text-lg h-14" id="status-filter" data-testid="select-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="safe">Verified Safe</SelectItem>
                  <SelectItem value="flagged">Fraud Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-6">
            <Button
              variant="outline"
              size="lg"
              className="text-lg"
              onClick={() => {
                setSearchTerm("");
                setFilterFormat("all");
                setFilterStatus("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear All Filters
            </Button>
          </div>
        </Card>

        {/* Transactions List */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-8 animate-pulse">
                <div className="h-32 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="space-y-6">
            {filteredTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="p-8 shadow-lg hover-elevate rounded-xl"
                data-testid={`transaction-card-${transaction.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Transaction Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-semibold text-foreground mb-2">
                          {transaction.recipientName || "Unknown Recipient"}
                        </h3>
                        <p className="text-lg text-muted-foreground">
                          Transaction ID: {transaction.transactionId}
                        </p>
                      </div>
                      <Badge
                        variant={transaction.fraudFlag ? "destructive" : "default"}
                        className="text-lg px-4 py-2"
                      >
                        {transaction.fraudFlag ? (
                          <>
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Risk: {transaction.fraudScore}%
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Verified
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-lg text-muted-foreground mb-1">Amount</p>
                        <p className="text-2xl font-bold text-foreground">
                          ${transaction.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-lg text-muted-foreground mb-1">Format</p>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {transaction.sourceFormat}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-lg text-muted-foreground mb-1">Date</p>
                        <p className="text-lg font-medium text-foreground">
                          {new Date(transaction.timestamp).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {transaction.remittanceInfo && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-lg text-muted-foreground mb-1">Payment Details</p>
                        <p className="text-lg text-foreground">{transaction.remittanceInfo}</p>
                      </div>
                    )}

                    {transaction.fraudFlag && transaction.fraudType && (
                      <div className="pt-4 border-t border-border">
                        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                          <p className="text-lg font-semibold text-destructive mb-2">
                            ⚠️ Fraud Alert: {transaction.fraudType}
                          </p>
                          {transaction.fraudSignals && transaction.fraudSignals.length > 0 && (
                            <ul className="space-y-1 text-lg text-muted-foreground">
                              {transaction.fraudSignals.map((signal, index) => (
                                <li key={index}>• {signal}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-4">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg h-14 min-w-48"
                      onClick={() => downloadXML(transaction)}
                      disabled={!transaction.iso20022Xml}
                      data-testid={`button-download-${transaction.id}`}
                    >
                      <Download className="mr-3 h-5 w-5" />
                      Download XML
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-16 text-center shadow-lg rounded-xl">
            <FileText className="h-24 w-24 text-muted-foreground mx-auto mb-6 opacity-50" />
            <p className="text-2xl font-semibold text-foreground mb-3">No Transactions Found</p>
            <p className="text-lg text-muted-foreground mb-8">
              {searchTerm || filterFormat !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters to see more results"
                : "Start by transforming your first payment"}
            </p>
            {!searchTerm && filterFormat === "all" && filterStatus === "all" && (
              <Button size="lg" className="text-lg px-8 py-6">
                Transform Payment
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
