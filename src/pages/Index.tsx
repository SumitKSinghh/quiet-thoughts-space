
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Calendar, CheckSquare, Shield, Sparkles } from 'lucide-react';
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account.",
        });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - App info */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <BookOpen className="h-16 w-16 text-blue-600" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Daily Journal
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Your personal space for reflection, growth, and organization. 
                Capture your thoughts, track your goals, and build better habits.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <Calendar className="h-8 w-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Daily Entries</h3>
                  <p className="text-gray-600 text-sm">Organize your thoughts by date with our intuitive calendar view</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckSquare className="h-8 w-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">To-Do Lists</h3>
                  <p className="text-gray-600 text-sm">Track tasks and goals alongside your journal entries</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Shield className="h-8 w-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Private & Secure</h3>
                  <p className="text-gray-600 text-sm">Your entries are encrypted and completely private</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Sparkles className="h-8 w-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Beautiful Design</h3>
                  <p className="text-gray-600 text-sm">Clean, distraction-free interface for focused writing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl">
                    {isLogin ? 'Welcome back' : 'Start your journey'}
                  </CardTitle>
                  <CardDescription>
                    {isLogin 
                      ? 'Sign in to access your journal' 
                      : 'Create your account to begin journaling'
                    }
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-gray-200 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-gray-200 focus:border-blue-500"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </Button>
                    
                    <div className="flex items-center space-x-4">
                      <Separator className="flex-1" />
                      <span className="text-sm text-gray-500">or</span>
                      <Separator className="flex-1" />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
      <footer className="bg-white/50 backdrop-blur-sm border-t border-blue-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            Built with ❤️ for mindful journaling and personal growth
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
