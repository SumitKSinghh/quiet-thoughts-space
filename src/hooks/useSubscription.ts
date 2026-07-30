import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  plan: "monthly" | "yearly";
  status: "active" | "cancelled" | "expired" | "pending";
  currency: string;
  amount: number;
  starts_at: string | null;
  ends_at: string | null;
}

// The single demo account that always has full premium access
const DEMO_ACCOUNT_EMAIL = "ssingh2100.2100@gmail.com";

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const isDemo =
        (user.email || "").toLowerCase() === DEMO_ACCOUNT_EMAIL.toLowerCase();
      setIsDemoAccount(isDemo);

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("ends_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
      }

      setSubscription(data as Subscription | null);
      setIsPremium(isDemo || !!data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return { subscription, loading, isPremium, isDemoAccount, refetch: fetchSubscription };
};
