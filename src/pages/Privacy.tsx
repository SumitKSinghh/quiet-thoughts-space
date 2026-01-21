import { Shield, Lock, Eye, Database, Bell, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Privacy = () => {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Account information (email address, name) when you register",
        "Journal entries, voice recordings, and notes you create",
        "Usage data including app interactions and preferences",
        "Device information for app optimization",
        "Payment information processed securely through Razorpay"
      ]
    },
    {
      icon: Lock,
      title: "How We Use Your Information",
      content: [
        "To provide and maintain our journaling services",
        "To personalize your experience with AI-powered insights",
        "To process payments and manage subscriptions",
        "To send important updates about our service",
        "To improve our app based on usage patterns"
      ]
    },
    {
      icon: Shield,
      title: "Data Security",
      content: [
        "All data is encrypted in transit and at rest",
        "We use industry-standard security protocols",
        "Regular security audits and vulnerability assessments",
        "Secure cloud infrastructure powered by Supabase",
        "Two-factor authentication support for accounts"
      ]
    },
    {
      icon: Eye,
      title: "Your Privacy Rights",
      content: [
        "Access and download your personal data anytime",
        "Request deletion of your account and data",
        "Opt-out of marketing communications",
        "Control visibility of your journal entries",
        "Update or correct your personal information"
      ]
    },
    {
      icon: UserCheck,
      title: "Data Sharing",
      content: [
        "We never sell your personal data to third parties",
        "Journal entries are private by default",
        "Community sharing is opt-in and under your control",
        "We only share data with service providers necessary for app operation",
        "Legal compliance may require disclosure in limited circumstances"
      ]
    },
    {
      icon: Bell,
      title: "Updates to Privacy Policy",
      content: [
        "We may update this policy from time to time",
        "Significant changes will be notified via email",
        "Continued use after changes constitutes acceptance",
        "Previous versions available upon request"
      ]
    }
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
            <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</Link>
            <Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</Link>
            <Link to="/refund" className="text-slate-400 hover:text-white transition-colors text-sm">Refund Policy</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500/20 rounded-full mb-6">
              <Shield className="w-8 h-8 text-teal-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-slate-400 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <Card className="bg-slate-800/50 border-white/10 mb-8">
            <CardContent className="pt-6">
              <p className="text-slate-300 leading-relaxed">
                At Daily Voice Journal, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our mobile application and services. 
                Please read this privacy policy carefully. By using our service, you agree to the collection and 
                use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={index} className="bg-slate-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <section.icon className="w-5 h-5 text-teal-400" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-slate-300">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-800/50 border-white/10 mt-8">
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-4">Contact Us About Privacy</h3>
              <p className="text-slate-300 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-slate-300">
                <p>Email: <a href="mailto:info@budfi.in" className="text-teal-400 hover:text-teal-300">info@budfi.in</a></p>
                <p>Phone: <a href="tel:+919439044619" className="text-teal-400 hover:text-teal-300">+91-9439044619</a></p>
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

export default Privacy;
