import { useState } from "react";
import { Crown, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingModal } from "./PricingModal";
import { useSubscription } from "@/hooks/useSubscription";

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
}

export const PremiumGate = ({ children, feature }: PremiumGateProps) => {
  const { isPremium, loading, refetch } = useSubscription();
  const [showPricing, setShowPricing] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-teal-500/20 blur-2xl rounded-full" />
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700">
            <Lock className="h-12 w-12 text-amber-400 mx-auto mb-2" />
            <Crown className="h-6 w-6 text-amber-400 absolute -top-2 -right-2" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Unlock {feature}
        </h2>
        <p className="text-slate-400 max-w-md mb-6">
          This premium feature helps you gain deeper insights and take your personal growth journey to the next level.
        </p>

        <Button
          onClick={() => setShowPricing(true)}
          className="bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-600 hover:to-teal-600 text-white font-semibold px-8 py-3 h-auto"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Upgrade to Premium
        </Button>

        <div className="mt-8 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-teal-400">AI</div>
            <div className="text-xs text-slate-500">Insights</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">24/7</div>
            <div className="text-xs text-slate-500">AI Coach</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">∞</div>
            <div className="text-xs text-slate-500">Community</div>
          </div>
        </div>
      </div>

      <PricingModal 
        open={showPricing} 
        onOpenChange={setShowPricing}
        onSuccess={refetch}
      />
    </>
  );
};
