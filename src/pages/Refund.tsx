import { RefreshCw, Clock, CreditCard, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Refund = () => {
  const eligibleReasons = [
    "Technical issues preventing access to premium features",
    "Accidental duplicate purchases",
    "Service not matching advertised features",
    "Unable to use due to unsupported device/region"
  ];

  const nonEligibleReasons = [
    "Change of mind after using premium features",
    "Failure to cancel before renewal",
    "Partial use of subscription period",
    "Violation of terms of service"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-slate-900/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Daily Voice Journal" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-semibold text-white">Daily Voice Journal</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</Link>
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500/20 rounded-full mb-6">
              <RefreshCw className="w-8 h-8 text-teal-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Refund Policy</h1>
            <p className="text-slate-400 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <Card className="bg-slate-800/50 border-white/10 mb-8">
            <CardContent className="pt-6">
              <p className="text-slate-300 leading-relaxed">
                We want you to be completely satisfied with your Daily Voice Journal subscription. 
                This refund policy outlines the terms and conditions for refund requests. We process 
                all payments through Razorpay, ensuring secure transactions.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Refund Period */}
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-teal-400" />
                  </div>
                  Refund Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-teal-400">7 Days</p>
                    <p className="text-slate-400 text-sm">Full refund window for all subscriptions</p>
                  </div>
                  <p className="text-slate-300 text-sm">
                    You can request a full refund within 7 days of your initial purchase. 
                    After this period, refunds are evaluated on a case-by-case basis.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Processing Time */}
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-teal-400" />
                  </div>
                  Processing Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-teal-400">5-7 Business Days</p>
                    <p className="text-slate-400 text-sm">For refund to reflect in your account</p>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Once approved, refunds are processed immediately. Bank processing times may vary 
                    depending on your financial institution.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Eligible/Non-eligible sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  Eligible for Refund
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {eligibleReasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  Not Eligible for Refund
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {nonEligibleReasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* How to Request */}
          <Card className="bg-slate-800/50 border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-teal-400" />
                </div>
                How to Request a Refund
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-white font-medium">Contact Support</p>
                      <p className="text-slate-400 text-sm">
                        Email us at <a href="mailto:info@budfi.in" className="text-teal-400 hover:text-teal-300">info@budfi.in</a> with 
                        your registered email and purchase details.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-white font-medium">Provide Details</p>
                      <p className="text-slate-400 text-sm">
                        Include your order ID, reason for refund, and any relevant screenshots or documentation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-white font-medium">Await Response</p>
                      <p className="text-slate-400 text-sm">
                        Our team will review your request and respond within 24-48 hours with a decision.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Cancellation */}
          <Card className="bg-slate-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Subscription Cancellation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                You can cancel your subscription at any time through your profile settings. Upon cancellation:
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                  You'll retain access to premium features until the end of your billing period
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                  No further charges will be made after cancellation
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                  Your data and journal entries remain safe and accessible
                </li>
              </ul>
              <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg mt-4">
                <p className="text-teal-300 text-sm">
                  <strong>Need help?</strong> Contact us at{" "}
                  <a href="mailto:info@budfi.in" className="underline">info@budfi.in</a> or call{" "}
                  <a href="tel:+919439044619" className="underline">+91-9439044619</a>
                </p>
              </div>
            </CardContent>
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
    </div>
  );
};

export default Refund;
