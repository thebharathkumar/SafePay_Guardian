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
import { AlertTriangle, Shield, Info, Phone } from "lucide-react";

interface FraudAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fraudScore: number;
  fraudType?: string;
  fraudSignals: string[];
  amount: number;
  recipient: string;
}

const scamEducation: Record<string, {
  description: string;
  preventionTips: string[];
}> = {
  "IRS Tax Scam": {
    description: "Scammers impersonate IRS agents demanding immediate payment for supposed tax debts or penalties.",
    preventionTips: [
      "The IRS never calls to demand immediate payment",
      "The IRS never threatens arrest over the phone",
      "The IRS contacts you by mail first, not by phone",
      "Don't provide personal information over unsolicited calls",
      "If in doubt, call the IRS directly at 1-800-829-1040"
    ]
  },
  "Grandparent Emergency Scam": {
    description: "Scammers pretend to be a grandchild in an emergency situation, asking for urgent money.",
    preventionTips: [
      "Always verify by calling your grandchild directly using a known number",
      "Ask questions only the real person would know",
      "Be suspicious of requests for secrecy",
      "Never send money through wire transfers for emergencies",
      "Contact other family members to verify the situation"
    ]
  },
  "Social Security Suspension": {
    description: "Scammers claim your Social Security number has been suspended due to suspicious activity.",
    preventionTips: [
      "Social Security numbers are NEVER suspended",
      "The Social Security Administration never calls to demand payment",
      "Contact SSA directly at 1-800-772-1213 if you have concerns",
      "Don't give your SSN to unsolicited callers",
      "Report suspicious calls to the SSA Inspector General"
    ]
  },
  "Tech Support Scam": {
    description: "Scammers pose as tech support claiming your computer has viruses and demanding payment for fixes.",
    preventionTips: [
      "Microsoft, Apple, and other tech companies never cold-call customers",
      "Never give remote access to your computer to unsolicited callers",
      "Don't trust pop-up warnings claiming you have a virus",
      "Use official support channels if you need technical help",
      "Install reputable antivirus software from known companies"
    ]
  }
};

export default function FraudAlertModal({
  open,
  onOpenChange,
  fraudScore,
  fraudType,
  fraudSignals,
}: FraudAlertModalProps) {
  const education = fraudType ? scamEducation[fraudType] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-destructive/20 to-warning/20 p-8 border-b border-border">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold text-foreground mb-3">
                Fraud Alert Detected
              </DialogTitle>
              <DialogDescription className="text-xl text-muted-foreground">
                This transaction has been flagged as potentially fraudulent
              </DialogDescription>
            </div>
            <Badge variant="destructive" className="text-xl px-6 py-3">
              {fraudScore}% Risk
            </Badge>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Warning Message */}
          <Card className="p-6 bg-destructive/5 border-2 border-destructive">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-destructive flex-shrink-0 mt-1" />
              <div>
                <p className="text-xl font-semibold text-foreground mb-3">
                  ⚠️ STOP - Do Not Proceed With This Payment
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our fraud detection system has identified this as a high-risk transaction.
                  We strongly recommend you speak with a bank representative before continuing.
                </p>
              </div>
            </div>
          </Card>

          {/* Detected Scam Type */}
          {fraudType && (
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Info className="h-7 w-7 text-primary" />
                Detected Scam Type
              </h3>
              <Card className="p-6" data-testid="card-scam-type">
                <p className="text-xl font-semibold text-destructive mb-3" data-testid="text-scam-name">{fraudType}</p>
                {education && (
                  <p className="text-lg text-muted-foreground leading-relaxed" data-testid="text-scam-description">
                    {education.description}
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* Warning Signs */}
          {fraudSignals.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold mb-4">Warning Signs Detected</h3>
              <Card className="p-6" data-testid="card-warning-signs">
                <ul className="space-y-3">
                  {fraudSignals.map((signal, index) => (
                    <li key={index} className="flex items-start gap-3" data-testid={`warning-signal-${index}`}>
                      <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                      <span className="text-lg text-foreground">{signal}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* How to Protect Yourself */}
          {education && education.preventionTips.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Shield className="h-7 w-7 text-chart-2" />
                How to Protect Yourself
              </h3>
              <Card className="p-6 bg-chart-2/5" data-testid="card-prevention-tips">
                <ul className="space-y-4">
                  {education.preventionTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3" data-testid={`prevention-tip-${index}`}>
                      <div className="h-8 w-8 rounded-full bg-chart-2 text-white flex items-center justify-center flex-shrink-0 text-base font-semibold">
                        {index + 1}
                      </div>
                      <span className="text-lg text-foreground leading-relaxed pt-1">
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* Call to Action */}
          <Card className="p-8 bg-primary/5 border-2 border-primary" data-testid="card-call-support">
            <div className="flex items-center gap-6">
              <Phone className="h-16 w-16 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-2xl font-semibold text-foreground mb-2">
                  Need Help? Call Us Now
                </p>
                <p className="text-xl text-primary font-bold mb-3" data-testid="text-support-phone">
                  1-800-SAFEPAY (1-800-723-3729)
                </p>
                <p className="text-lg text-muted-foreground">
                  Our fraud prevention specialists are available 24/7 to assist you.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              size="lg"
              variant="destructive"
              className="flex-1 text-xl h-16"
              onClick={() => onOpenChange(false)}
              data-testid="button-block-transaction"
            >
              Block This Transaction
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 text-xl h-16"
              onClick={() => onOpenChange(false)}
              data-testid="button-review-later"
            >
              Review With Banker
            </Button>
          </div>

          <p className="text-center text-lg text-muted-foreground italic" data-testid="text-fraud-reminder">
            Remember: Legitimate organizations will never pressure you to make immediate payments
            or threaten you with legal action over the phone.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
