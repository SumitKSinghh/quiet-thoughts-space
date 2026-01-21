import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24-48 hours.",
    });
    
    setName("");
    setEmail("");
    setMessage("");
    setIsSubmitting(false);
  };

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
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy</Link>
            <Link to="/refund" className="text-slate-400 hover:text-white transition-colors text-sm">Refund Policy</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-slate-400 text-lg">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-teal-400" />
                    Email Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href="mailto:info@budfi.in" 
                    className="text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    info@budfi.in
                  </a>
                  <p className="text-slate-400 text-sm mt-2">
                    We typically respond within 24-48 hours
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Phone className="w-5 h-5 text-teal-400" />
                    Call Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href="tel:+919439044619" 
                    className="text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    +91-9439044619
                  </a>
                  <p className="text-slate-400 text-sm mt-2">
                    Monday - Friday, 10:00 AM - 6:00 PM IST
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-400" />
                    Our Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">India</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Serving users worldwide
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="bg-slate-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Your Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Message</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      required
                      rows={5}
                      className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
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

export default Contact;
