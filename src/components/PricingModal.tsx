import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PricingModal = ({ open, onOpenChange, onSuccess }: PricingModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Detect if user is from India based on timezone
  const isIndian = Intl.DateTimeFormat().resolvedOptions().timeZone.includes("Kolkata") ||
                   Intl.DateTimeFormat().resolvedOptions().timeZone.includes("Calcutta");

  const currency = isIndian ? "INR" : "USD";
  const currencySymbol = isIndian ? "₹" : "$";

  const plans = [
    {
      id: "monthly",
      name: "Monthly",
      price: isIndian ? 199 : 4.99,
      period: "/month",
      features: ["AI Insights & Analysis", "AI Chat Assistant", "Community Access", "Unlimited Journals"],
    },
    {
      id: "yearly",
      name: "Yearly",
      price: isIndian ? 1999 : 49.99,
      period: "/year",
      popular: true,
      savings: isIndian ? "Save ₹389" : "Save $10",
      features: ["AI Insights & Analysis", "AI Chat Assistant", "Community Access", "Unlimited Journals", "2 Months Free"],
    },
  ];

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please login",
          description: "You need to be logged in to subscribe",
          variant: "destructive",
        });
        return;
      }

      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "razorpay-create-order",
        {
          body: { plan, currency },
        }
      );

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Failed to create order");
      }

      const { orderId, amount, keyId } = orderData;

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Quiet Thoughts",
        description: `${plan === "yearly" ? "Yearly" : "Monthly"} Premium Subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "razorpay-verify-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan,
                  currency,
                  amount,
                },
              }
            );

            if (verifyError) {
              throw new Error(verifyError.message);
            }

            toast({
              title: "🎉 Welcome to Premium!",
              description: "Your subscription is now active. Enjoy all premium features!",
            });

            onSuccess?.();
            onOpenChange(false);
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast({
              title: "Payment verification failed",
              description: error.message,
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#14b8a6",
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-amber-400" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-slate-400 mb-6">
            Unlock AI-powered insights, personalized coaching, and connect with the community.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-6 transition-all ${
                  plan.popular
                    ? "border-teal-500 bg-slate-800/80 shadow-lg shadow-teal-500/10"
                    : "border-slate-700 bg-slate-800/50"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold">
                      {currencySymbol}{plan.price}
                    </span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <Badge variant="secondary" className="mt-2 bg-emerald-500/20 text-emerald-400 border-0">
                      {plan.savings}
                    </Badge>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-teal-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!loading}
                >
                  {loading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Secure payment powered by Razorpay. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
