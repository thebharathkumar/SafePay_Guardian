import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, CheckCircle2, Upload, Download, FileText, Shield } from "lucide-react";
import type { TransformResponse } from "@shared/schema";
import FraudAlertModal from "@/components/FraudAlertModal";

export default function Transform() {
  const [format, setFormat] = useState<"MT103" | "NACHA">("MT103");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<TransformResponse | null>(null);
  const [showFraudAlert, setShowFraudAlert] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sampleMT103 = `:20:TRX123456789
:23B:CRED
:32A:250315USD2500,00
:50K:John Smith
123 Oak Street
Chicago IL 60601
:59:Mary Johnson
456 Pine Avenue
Springfield IL 62701
:70:Monthly Support Payment
:71A:SHA`;

  const sampleNACHA = `101 123456789 987654321 2503150800A094101Bank Name           Company Name           
5225Company Name            1234567890CCDPAYROLL   250315   1987654321000001
62212345678901234567890000025000EMPLOYEE001       Doe, John                       0987654321000001
822500000100123456780000000000000000250001234567890                         987654321000001
9000001000001000000010012345678000000000000000002500                                       `;

  const transformMutation = useMutation({
    mutationFn: async (data: { format: string; content: string }) => {
      return await apiRequest<TransformResponse>("POST", "/api/transform", data);
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      if (data.fraudFlag) {
        setShowFraudAlert(true);
      } else {
        toast({
          title: "Transformation Successful",
          description: `Payment converted to ISO 20022 format. Fraud Score: ${data.fraudScore}%`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Transformation Failed",
        description: error.message || "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const handleTransform = () => {
    if (!content.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter payment data to transform.",
        variant: "destructive",
      });
      return;
    }

    transformMutation.mutate({ format, content });
  };

  const handleDownload = () => {
    if (!result?.iso20022Xml) return;

    const blob = new Blob([result.iso20022Xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${format}_ISO20022_${result.transactionId}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your XML file is being downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-3" data-testid="text-transform-title">
            Transform Payment
          </h1>
          <p className="text-xl text-muted-foreground">
            Convert legacy payment formats to modern ISO 20022 standard
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Step Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {["Upload", "Transform", "Validate", "Download"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-semibold ${
                      index === 0 || result
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="mt-3 text-lg font-medium">{step}</span>
                </div>
                {index < 3 && (
                  <div
                    className={`h-1 w-24 mx-4 ${
                      result ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="p-8 shadow-lg rounded-xl" data-testid="card-input">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Upload className="h-8 w-8 text-primary" />
              Input Payment Data
            </h2>

            {/* Format Selection */}
            <div className="mb-6">
              <Label className="text-lg font-medium mb-4 block">Select Format</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={format === "MT103" ? "default" : "outline"}
                  size="lg"
                  className="text-lg h-16"
                  onClick={() => setFormat("MT103")}
                  data-testid="button-format-mt103"
                >
                  <FileText className="mr-3 h-6 w-6" />
                  SWIFT MT103
                </Button>
                <Button
                  variant={format === "NACHA" ? "default" : "outline"}
                  size="lg"
                  className="text-lg h-16"
                  onClick={() => setFormat("NACHA")}
                  data-testid="button-format-nacha"
                >
                  <FileText className="mr-3 h-6 w-6" />
                  NACHA CCD
                </Button>
              </div>
            </div>

            {/* Sample Data Button */}
            <div className="mb-6">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-lg h-14"
                onClick={() => setContent(format === "MT103" ? sampleMT103 : sampleNACHA)}
                data-testid="button-load-sample"
              >
                Load Sample {format} Data
              </Button>
            </div>

            {/* Input Textarea */}
            <div className="mb-6">
              <Label htmlFor="payment-content" className="text-lg font-medium mb-4 block">
                Paste {format} Content
              </Label>
              <Textarea
                id="payment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Paste your ${format} payment message here...`}
                className="min-h-[400px] text-lg font-mono resize-none"
                data-testid="input-payment-content"
              />
            </div>

            {/* Transform Button */}
            <Button
              size="lg"
              className="w-full text-xl h-16"
              onClick={handleTransform}
              disabled={transformMutation.isPending || !content.trim()}
              data-testid="button-transform"
            >
              {transformMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Transforming...
                </>
              ) : (
                <>
                  <Shield className="mr-3 h-6 w-6" />
                  Transform & Analyze
                </>
              )}
            </Button>
          </Card>

          {/* Output Section */}
          <Card className="p-8 shadow-lg rounded-xl sticky top-8" data-testid="card-output">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              ISO 20022 Output
            </h2>

            {result ? (
              <div className="space-y-6">
                {/* Validation Status */}
                <div
                  className={`p-6 rounded-lg border-2 ${
                    result.success
                      ? "bg-chart-2/10 border-chart-2"
                      : "bg-destructive/10 border-destructive"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    {result.success ? (
                      <CheckCircle2 className="h-10 w-10 text-chart-2" />
                    ) : (
                      <AlertCircle className="h-10 w-10 text-destructive" />
                    )}
                    <div>
                      <p className="text-xl font-semibold">
                        {result.success ? "Valid XML Generated" : "Validation Failed"}
                      </p>
                      <p className="text-lg text-muted-foreground mt-1">
                        Transaction ID: {result.transactionId}
                      </p>
                    </div>
                  </div>

                  {/* Fraud Score */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Fraud Risk Score:</span>
                      <Badge
                        variant={result.fraudFlag ? "destructive" : "default"}
                        className="text-lg px-4 py-2"
                      >
                        {result.fraudScore}%
                      </Badge>
                    </div>
                    {result.fraudType && (
                      <p className="text-lg text-destructive mt-3 font-medium">
                        ⚠️ Detected: {result.fraudType}
                      </p>
                    )}
                  </div>
                </div>

                {/* XML Preview */}
                {result.iso20022Xml && (
                  <div>
                    <Label className="text-lg font-medium mb-3 block">XML Preview</Label>
                    <div className="bg-muted p-6 rounded-lg border border-border max-h-[400px] overflow-auto">
                      <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                        {result.iso20022Xml}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full text-xl h-16"
                  onClick={handleDownload}
                  disabled={!result.iso20022Xml}
                  data-testid="button-download"
                >
                  <Download className="mr-3 h-6 w-6" />
                  Download XML File
                </Button>

                {/* Warnings/Errors */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="p-6 bg-warning/10 border border-warning rounded-lg">
                    <p className="text-lg font-semibold mb-3">⚠️ Warnings:</p>
                    <ul className="space-y-2">
                      {result.warnings.map((warning, index) => (
                        <li key={index} className="text-lg text-muted-foreground">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="p-6 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-lg font-semibold mb-3 text-destructive">❌ Errors:</p>
                    <ul className="space-y-2">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-lg text-destructive">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="h-24 w-24 text-muted-foreground opacity-50 mb-6" />
                <p className="text-xl text-muted-foreground mb-3">
                  No transformation yet
                </p>
                <p className="text-lg text-muted-foreground">
                  Enter payment data and click Transform to see results
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Fraud Alert Modal */}
      <FraudAlertModal
        open={showFraudAlert}
        onOpenChange={setShowFraudAlert}
        transaction={result}
      />
    </div>
  );
}
