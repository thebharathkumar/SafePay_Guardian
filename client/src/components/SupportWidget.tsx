import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, X, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const callbackMutation = useMutation({
    mutationFn: async (data: { phone: string; message?: string }) => {
      return await apiRequest("/api/callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Callback Requested",
        description: "A banker will call you within 15 minutes.",
      });
      setShowCallbackForm(false);
      setPhone("");
      setMessage("");
      setIsOpen(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to request callback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCallbackRequest = (e: React.FormEvent) => {
    e.preventDefault();
    callbackMutation.mutate({ phone, message });
  };

  return (
    <>
      {/* Floating Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 h-20 w-20 rounded-full bg-primary text-primary-foreground shadow-xl hover-elevate active-elevate-2 flex items-center justify-center"
          aria-label="Open support widget"
          data-testid="button-open-support"
        >
          <Phone className="h-10 w-10" />
        </button>
      )}

      {/* Support Widget */}
      {isOpen && (
        <Card className="fixed bottom-8 right-8 z-50 w-[420px] shadow-2xl rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold">Need Help?</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCallbackForm(false);
                }}
                className="h-12 w-12 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close support widget"
                data-testid="button-close-support"
              >
                <X className="h-7 w-7" />
              </button>
            </div>
            <p className="text-lg opacity-95">We're here to help you stay safe</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showCallbackForm ? (
              <div className="space-y-4">
                {/* Call Now Button */}
                <Button
                  size="lg"
                  className="w-full text-xl h-16 gap-3"
                  variant="default"
                  data-testid="button-call-now"
                >
                  <Phone className="h-6 w-6" />
                  Call Now: 1-800-SAFEPAY
                </Button>

                {/* Request Callback Button */}
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-xl h-16 gap-3"
                  onClick={() => setShowCallbackForm(true)}
                  data-testid="button-request-callback"
                >
                  <MessageCircle className="h-6 w-6" />
                  Request Callback
                </Button>

                {/* Info */}
                <div className="pt-4 border-t border-border">
                  <p className="text-lg text-muted-foreground text-center leading-relaxed">
                    Available 24/7 for fraud prevention and payment support
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCallbackRequest} className="space-y-6">
                <div>
                  <Label htmlFor="callback-phone" className="text-lg font-medium mb-3 block">
                    Phone Number
                  </Label>
                  <Input
                    id="callback-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="text-lg h-14"
                    required
                    data-testid="input-callback-phone"
                  />
                  <p className="text-lg text-muted-foreground mt-2">
                    We'll call you at this number
                  </p>
                </div>

                <div>
                  <Label htmlFor="callback-message" className="text-lg font-medium mb-3 block">
                    How can we help?
                  </Label>
                  <Textarea
                    id="callback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your concern..."
                    className="text-lg min-h-[100px] resize-none"
                    data-testid="input-callback-message"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1 text-lg h-14"
                    onClick={() => setShowCallbackForm(false)}
                    data-testid="button-callback-back"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 text-lg h-14 gap-2"
                    disabled={callbackMutation.isPending}
                    data-testid="button-submit-callback"
                  >
                    <Send className="h-5 w-5" />
                    {callbackMutation.isPending ? "Requesting..." : "Request Call"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
