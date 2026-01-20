
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, CheckSquare, Shield, Sparkles, Heart, Star, Zap, Mail, Phone, BookOpen, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        navigate('/dashboard');
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) throw error;
        
        if (data.user && data.session) {
          toast({
            title: "Account created!",
            description: "Welcome to Daily Journal! You're now logged in.",
          });
        } else {
          toast({
            title: "Account created!",
            description: "You can now sign in with your credentials.",
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "Daily Journaling",
      description: "Capture your thoughts with our beautiful editor",
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and achieve your personal milestones",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      icon: Calendar,
      title: "Smart Calendar",
      description: "Organize your life with intuitive planning",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: TrendingUp,
      title: "AI Insights",
      description: "Get personalized growth recommendations",
      gradient: "from-emerald-500 to-teal-500"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "50K+", label: "Journal Entries" },
    { value: "99.9%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Back to Dashboard button for logged in users */}
      {user && (
        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white hover:bg-white/10 gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Dashboard
          </Button>
        </div>
      )}

      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left side - App info */}
          <div className="space-y-8">
            {/* Logo and brand */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-xl opacity-50"></div>
                <img 
                  src={logo} 
                  alt="Daily Voice Journal" 
                  className="relative h-16 w-16 object-contain rounded-2xl bg-white/10 backdrop-blur-xl p-2 border border-white/10"
                />
              </div>
              <span className="text-xl font-semibold text-white/90">Daily Voice Journal</span>
            </div>

            {/* Main heading */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">Your Journey to</span>
                <br />
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Self-Discovery
                </span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                Capture your thoughts, track your goals, and unlock powerful AI insights. 
                Build lasting habits with our gamified journaling experience.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${feature.gradient} shrink-0`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                      <p className="text-slate-400 text-xs mt-1">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-slate-500 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
                <CardHeader className="space-y-2 text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-2">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">
                    {isLogin ? 'Welcome Back' : 'Get Started'}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {isLogin 
                      ? 'Continue your journaling journey' 
                      : 'Create your account and start today'
                    }
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-teal-500/50 focus:ring-teal-500/20 rounded-xl h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-teal-500/50 focus:ring-teal-500/20 rounded-xl h-11"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold h-11 rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/25"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {isLogin ? 'Sign In' : 'Create Account'}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                    
                    <div className="flex items-center gap-4">
                      <Separator className="flex-1 bg-white/10" />
                      <span className="text-sm text-slate-500">or</span>
                      <Separator className="flex-1 bg-white/10" />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
                      onClick={() => setIsLogin(!isLogin)}
                    >
                      {isLogin 
                        ? "Don't have an account? Sign up" 
                        : "Already have an account? Sign in"
                      }
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img src={logo} alt="Daily Voice Journal" className="h-8 w-8 rounded-lg" />
              <span className="text-slate-400 text-sm">Built for mindful journaling</span>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-6">
              <a 
                href="mailto:info@budfi.in" 
                className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors text-sm"
              >
                <Mail className="h-4 w-4" />
                <span>info@budfi.in</span>
              </a>
              <a 
                href="https://wa.me/919439044619" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors text-sm"
              >
                <Phone className="h-4 w-4" />
                <span>+91-9439044619</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ElevenLabs ConvAI Widget */}
      {/* @ts-ignore */}
      <elevenlabs-convai agent-id="agent_9901ka0em19jerm9qr2t8aj0w1vr"></elevenlabs-convai>
    </div>
  );
};

export default Index;
