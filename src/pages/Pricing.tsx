import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Crown, Sparkles, Brain, Users, Mic, Calendar, Target, Shield, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { PricingModal } from "@/components/PricingModal";
import logo from "@/assets/logo.png";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [isIndian, setIsIndian] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { isPremium, loading: isLoading } = useSubscription();

  useEffect(() => {
    // Detect user's region using timezone (instant, no network call)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setIsIndian(tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Kolkata'));

    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const pricing = {
    india: {
      monthly: { price: "₹199", period: "/month", savings: null },
      yearly: { price: "₹1,999", period: "/year", savings: "Save ₹389" }
    },
    international: {
      monthly: { price: "$4.99", period: "/month", savings: null },
      yearly: { price: "$49.99", period: "/year", savings: "Save $9.89" }
    }
  };

  const currentPricing = isIndian ? pricing.india : pricing.international;
  const selectedPlan = isYearly ? currentPricing.yearly : currentPricing.monthly;

  const freeFeatures = [
    { icon: Mic, text: "Voice journaling with transcription" },
    { icon: Calendar, text: "Unlimited journal entries" },
    { icon: Target, text: "Basic goal tracking" },
    { icon: Shield, text: "Secure cloud storage" }
  ];

  const premiumFeatures = [
    { icon: Brain, text: "AI-powered insights & analysis", highlight: true },
    { icon: Sparkles, text: "Personal AI chat companion", highlight: true },
    { icon: Users, text: "Community access & sharing", highlight: true },
    { icon: Zap, text: "Advanced mood analytics" },
    { icon: Target, text: "AI goal recommendations" },
    { icon: Calendar, text: "Google Calendar integration" }
  ];

  const faqs = [
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay. All payments are processed securely."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from your profile settings. You'll continue to have access to premium features until the end of your billing period."
    },
    {
      question: "Is there a refund policy?",
      answer: "Yes, we offer a 7-day refund policy for all new subscriptions. If you're not satisfied, contact us within 7 days for a full refund."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Your journal entries and data remain safe and accessible even after cancellation. You just won't have access to premium features like AI insights."
    },
    {
      question: "Can I switch between monthly and yearly plans?",
      answer: "Yes, you can switch plans anytime. If you upgrade to yearly, you'll receive prorated credit for your remaining monthly subscription."
    },
    {
      question: "Do you offer a free trial?",
      answer: "Currently, we don't offer a free trial, but we have a 7-day money-back guarantee so you can try premium risk-free."
    }
  ];

  const handleSubscribe = () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setShowPricingModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Daily Voice Journal" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-semibold text-white">Daily Voice Journal</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</Link>
            <Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</Link>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">Login</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 mb-4">
            <Crown className="w-3 h-3 mr-1" />
            Premium Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Get AI-powered insights, personalized recommendations, and join a community of mindful journalers.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isYearly ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-teal-600"
          />
          <span className={`text-sm ${isYearly ? 'text-white' : 'text-slate-400'}`}>Yearly</span>
          {isYearly && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              {selectedPlan.savings}
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {/* Free Plan */}
          <Card className="bg-slate-800/50 border-white/10 relative overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-2xl">Free</CardTitle>
              <CardDescription className="text-slate-400">
                Perfect for getting started
              </CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-slate-400">/forever</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-300">
                    <div className="p-1 bg-slate-700 rounded">
                      <feature.icon className="w-4 h-4 text-slate-400" />
                    </div>
                    {feature.text}
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                className="w-full mt-6 border-white/20 text-white hover:bg-white/10"
                onClick={() => window.location.href = user ? '/dashboard' : '/login'}
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-gradient-to-br from-teal-900/50 to-slate-800/50 border-teal-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl" />
            <Badge className="absolute top-4 right-4 bg-teal-500 text-white">
              Most Popular
            </Badge>
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                Premium
              </CardTitle>
              <CardDescription className="text-slate-400">
                For serious journalers
              </CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold text-white">{selectedPlan.price}</span>
                <span className="text-slate-400">{selectedPlan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <ul className="space-y-3">
                {/* Include free features */}
                {freeFeatures.map((feature, index) => (
                  <li key={`free-${index}`} className="flex items-center gap-3 text-slate-300">
                    <div className="p-1 bg-teal-500/20 rounded">
                      <Check className="w-4 h-4 text-teal-400" />
                    </div>
                    {feature.text}
                  </li>
                ))}
                {/* Premium exclusive features */}
                {premiumFeatures.map((feature, index) => (
                  <li key={`premium-${index}`} className={`flex items-center gap-3 ${feature.highlight ? 'text-white font-medium' : 'text-slate-300'}`}>
                    <div className={`p-1 rounded ${feature.highlight ? 'bg-teal-500' : 'bg-teal-500/20'}`}>
                      <feature.icon className={`w-4 h-4 ${feature.highlight ? 'text-white' : 'text-teal-400'}`} />
                    </div>
                    {feature.text}
                    {feature.highlight && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs ml-auto">
                        Premium
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700"
                onClick={handleSubscribe}
                disabled={isLoading || isPremium}
              >
                {isPremium ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Currently Subscribed
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Feature Comparison</h2>
          <Card className="bg-slate-800/50 border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-slate-400 font-medium">Feature</th>
                    <th className="text-center p-4 text-slate-400 font-medium">Free</th>
                    <th className="text-center p-4 text-teal-400 font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Journal Entries", free: "Unlimited", premium: "Unlimited" },
                    { feature: "Voice Recording", free: true, premium: true },
                    { feature: "Goal Tracking", free: "Basic", premium: "Advanced + AI" },
                    { feature: "Cloud Sync", free: true, premium: true },
                    { feature: "AI Insights", free: false, premium: true },
                    { feature: "AI Chat Companion", free: false, premium: true },
                    { feature: "Community Access", free: false, premium: true },
                    { feature: "Mood Analytics", free: "Basic", premium: "Advanced" },
                    { feature: "Google Calendar", free: false, premium: true },
                    { feature: "Priority Support", free: false, premium: true },
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-white/5">
                      <td className="p-4 text-white">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <Check className="w-5 h-5 text-green-400 mx-auto" />
                          ) : (
                            <span className="text-slate-500">—</span>
                          )
                        ) : (
                          <span className="text-slate-300">{row.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.premium === 'boolean' ? (
                          row.premium ? (
                            <Check className="w-5 h-5 text-teal-400 mx-auto" />
                          ) : (
                            <span className="text-slate-500">—</span>
                          )
                        ) : (
                          <span className="text-teal-300">{row.premium}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-500/20 rounded-full mb-4">
              <HelpCircle className="w-6 h-6 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-slate-800/50 border border-white/10 rounded-lg px-4"
              >
                <AccordionTrigger className="text-white hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Card className="bg-gradient-to-r from-teal-900/50 to-cyan-900/50 border-teal-500/30 p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-2">Ready to transform your journaling?</h3>
            <p className="text-slate-400 mb-6">Join thousands of users who've unlocked their potential with Premium.</p>
            <Button 
              size="lg" 
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleSubscribe}
              disabled={isPremium}
            >
              {isPremium ? 'Already Premium' : 'Get Premium Now'}
            </Button>
            <p className="text-slate-500 text-sm mt-4">7-day money-back guarantee • Cancel anytime</p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Daily Voice Journal. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>

      {/* Pricing Modal */}
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </div>
  );
};

export default Pricing;
