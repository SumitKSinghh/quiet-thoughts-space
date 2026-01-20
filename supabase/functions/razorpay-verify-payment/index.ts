import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid user");
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      currency,
      amount,
    } = await req.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const encoder = new TextEncoder();
    const key = encoder.encode(razorpayKeySecret);
    const message = encoder.encode(body);
    
    const hmac = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", hmac, message);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature mismatch:", { expected: expectedSignature, received: razorpay_signature });
      throw new Error("Invalid payment signature");
    }

    // Calculate subscription dates
    const now = new Date();
    const endsAt = new Date(now);
    if (plan === "yearly") {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1);
    }

    // Check for existing active subscription and update/create
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan,
          currency,
          amount,
          razorpay_payment_id,
          ends_at: endsAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", existingSub.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        throw new Error("Failed to update subscription");
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan,
        status: "active",
        currency,
        amount,
        razorpay_subscription_id: razorpay_order_id,
        razorpay_payment_id,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      });

      if (insertError) {
        console.error("Error creating subscription:", insertError);
        throw new Error("Failed to create subscription");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Subscription activated" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
