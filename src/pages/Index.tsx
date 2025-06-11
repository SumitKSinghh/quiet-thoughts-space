
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Calendar, CheckSquare, Shield, Sparkles, Heart, Star, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        navigate('/dashboard');
      }
    });

    // Listen for auth changes
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
        
        // Since email confirmation is disabled, the user should be logged in immediately
        if (data.user && data.session) {
          toast({
            title: "Account created!",
            description: "Welcome to Daily Journal! You're now logged in.",
          });
          // Navigation will be handled by the auth state change listener
        } else {
          toast({
            title: "Account created!",
            description: "You can now sign in with your credentials.",
          });
          setIsLogin(true); // Switch to login mode
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - App info */}
          <div className="space-y-8 animate-fade-in">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="relative">
                  <BookOpen className="h-20 w-20 text-white drop-shadow-lg hover:scale-110 transition-transform duration-300" />
                  <Sparkles className="h-8 w-8 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent mb-6 drop-shadow-lg">
                Daily Journal
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed drop-shadow backdrop-blur-sm">
                ✨ Your personal space for reflection, growth, and organization. 
                Capture your thoughts, track your goals, and build better habits with style! 💫
              </p>
            </div>

            {/* Enhanced Features Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-lg">Daily Entries</h3>
                  <p className="text-white/80 text-sm">Organize thoughts with our intuitive calendar view ✨</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="p-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400">
                  <CheckSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-lg">Smart To-Dos</h3>
                  <p className="text-white/80 text-sm">Track tasks and goals with intelligent organization 🎯</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-lg">Ultra Secure</h3>
                  <p className="text-white/80 text-sm">Bank-level encryption keeps your thoughts safe 🔒</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="p-2 rounded-full bg-gradient-to-r from-orange-400 to-red-400">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-lg">Lightning Fast</h3>
                  <p className="text-white/80 text-sm">Instant sync across all your devices ⚡</p>
                </div>
              </div>
            </div>

            {/* Stats section */}
            <div className="flex justify-center lg:justify-start space-x-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-white/80 text-sm">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-white/80 text-sm">Journal Entries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-white/80 text-sm">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right side - Enhanced Auth form */}
          <div className="flex justify-center lg:justify-end animate-scale-in">
            <div className="w-full max-w-md">
              <Card className="shadow-2xl border-0 bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/25 transition-all duration-300">
                <CardHeader className="space-y-1 text-center">
                  <div className="flex justify-center mb-4">
                    <Star className="h-8 w-8 text-yellow-300 animate-pulse" />
                  </div>
                  <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {isLogin ? 'Welcome Back! 👋' : 'Join the Journey! 🚀'}
                  </CardTitle>
                  {isLogin && (
                    <div className="text-xl font-semibold text-purple-700 mt-2">
                      Let's Plan
                    </div>
                  )}
                  <CardDescription className="text-gray-700 font-medium">
                    {isLogin 
                      ? 'Ready to continue your growth story?' 
                      : 'Start your amazing journaling adventure today!'
                    }
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold">Email ✉️</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-2 border-purple-200 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-500 rounded-xl"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-semibold">Password 🔑</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Your secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-2 border-purple-200 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-500 rounded-xl"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold py-3 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
                      disabled={loading}
                    >
                      {loading ? 'Magic happening... ✨' : (isLogin ? 'Sign In 🎉' : 'Create Account 🌟')}
                    </Button>
                    
                    <div className="flex items-center space-x-4">
                      <Separator className="flex-1 bg-purple-300" />
                      <span className="text-sm text-gray-600 font-medium">or</span>
                      <Separator className="flex-1 bg-purple-300" />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-purple-700 hover:text-purple-800 hover:bg-purple-100/50 font-semibold rounded-xl transition-all duration-300"
                      onClick={() => setIsLogin(!isLogin)}
                    >
                      {isLogin 
                        ? "New here? Join the community! 🎊" 
                        : "Already part of the family? Welcome back! 💖"
                      }
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-2 mb-4">
              <Heart className="h-6 w-6 text-red-400 animate-pulse" />
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
              <Star className="h-6 w-6 text-blue-300 animate-pulse" />
            </div>
            <p className="text-white/90 text-lg font-medium">
              Built with 💖 for mindful journaling and personal growth
            </p>
            <p className="text-white/70 text-sm">
              Join thousands of users on their journey to self-discovery ✨
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
