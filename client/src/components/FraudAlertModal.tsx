import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Phone, ShieldAlert, Info } from "lucide-react";
import type { TransformResponse } from "@shared/schema";

interface FraudAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransformResponse | null;
}

export default function FraudAlertModal({
  open,
  onOpenChange,
  transaction,
}: FraudAlertModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/transactions/${data.id}`, {
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  const createCallbackMutation = useMutation({
    mutationFn: async (data: { reason: string; priority: string }) => {
      return await apiRequest("POST", "/api/callbacks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/callbacks"] });
    },
  });

  const handleApprove = async () => {
    if (!transaction?.transactionId) return;

    await updateTransactionMutation.mutateAsync({
      id: transaction.transactionId,
      status: "approved",
    });

    toast({
      title: "Payment Approved",
      description: "The transaction has been approved and will be processed.",
    });

    onOpenChange(false);
  };

  const handleBlock = async () => {
    if (!transaction?.transactionId) return;

    await updateTransactionMutation.mutateAsync({
      id: transaction.transactionId,
      status: "blocked",
    });

    toast({
      title: "Payment Blocked",
      description: "The suspicious transaction has been blocked for your protection.",
      variant: "default",
    });

    onOpenChange(false);
  };

  const handleCallMe = async () => {
    const scamType = transaction?.detectedScams?.[0]?.name || "Suspicious Transaction";

    await createCallbackMutation.mutateAsync({
      reason: `Fraud alert assistance needed for ${scamType}`,
      priority: "high",
    });

    toast({
      title: "Callback Requested",
      description: "A banker will call you within 15 minutes to assist with this transaction.",
    });

    onOpenChange(false);
  };

  if (!transaction) return null;

  const primaryScam = transaction.detectedScams?.[0];
  const fraudScore = transaction.fraudScore || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        data-testid="modal-fraud-alert"
      >
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold text-destructive mb-2" data-testid="text-fraud-alert-title">
                ⚠️ Fraud Alert Detected
              </DialogTitle>
              <Badge variant="destructive" className="text-lg px-4 py-1.5 font-semibold">
                {fraudScore}% Fraud Risk Score
              </Badge>
            </div>
          </div>
          <DialogDescription className="sr-only">
            A potentially fraudulent transaction has been detected. Please review the details and choose an action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scam Type Warning */}
          {primaryScam && (
            <Card className="border-2 border-destructive/20 bg-destructive/5 p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-7 w-7 text-destructive flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-destructive mb-2" data-testid="text-scam-type">
                    {primaryScam.name}
                  </h3>
                  <p className="text-xl text-foreground leading-relaxed">
                    {primaryScam.description}
                  </p>
                  {primaryScam.matchedTriggers && primaryScam.matchedTriggers.length > 0 && (
                    <div className="mt-3">
                      <p className="text-lg font-medium text-muted-foreground mb-2">
                        Suspicious keywords detected:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {primaryScam.matchedTriggers.map((trigger, idx) => (
                          <Badge 
                            key={idx} 
                            variant="destructive" 
                            className="text-base px-3 py-1"
                          >
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Transaction Details */}
          <Card className="p-6">
            <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Transaction Details
            </h4>
            <div className="space-y-3 text-lg">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-xl">${transaction.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-medium">{transaction.recipientName || "N/A"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Payment Info:</span>
                <span className="font-medium text-right max-w-md">{transaction.remittanceInfo || "N/A"}</span>
              </div>
            </div>
          </Card>

          {/* Prevention Tips */}
          {primaryScam?.preventionTips && primaryScam.preventionTips.length > 0 && (
            <Card className="border-2 border-primary/20 bg-primary/5 p-6">
              <h4 className="text-2xl font-bold mb-4 text-foreground" data-testid="text-prevention-tips">
                🛡️ How to Protect Yourself
              </h4>
              <ul className="space-y-3">
                {primaryScam.preventionTips.map((tip, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start gap-3 text-lg leading-relaxed"
                  >
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Action Buttons - WCAG AAA Compliant */}
          <div className="space-y-4 pt-4">
            <h4 className="text-2xl font-bold text-center mb-4">What would you like to do?</h4>
            
            {/* Approve Button */}
            <Button
              onClick={handleApprove}
              disabled={updateTransactionMutation.isPending}
              className="w-full h-14 text-xl font-semibold bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-approve-payment"
            >
              <CheckCircle2 className="h-6 w-6 mr-3" />
              ✅ Yes, I Made This Payment
            </Button>

            {/* Block Button */}
            <Button
              onClick={handleBlock}
              disabled={updateTransactionMutation.isPending}
              variant="destructive"
              className="w-full h-14 text-xl font-semibold"
              data-testid="button-block-payment"
            >
              <ShieldAlert className="h-6 w-6 mr-3" />
              🚫 No, This Is Fraud - Block It
            </Button>

            {/* Call Me Button */}
            <Button
              onClick={handleCallMe}
              disabled={createCallbackMutation.isPending}
              className="w-full h-14 text-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-request-call"
            >
              <Phone className="h-6 w-6 mr-3" />
              📞 Call Me - I Need Help
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
