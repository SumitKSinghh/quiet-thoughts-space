
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/dashboard');
      }
    });
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
        
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) throw error;
        
        if (data.user && !data.session) {
          // Email confirmation required
          setSignUpEmail(email);
          setShowEmailConfirmation(true);
          setEmail('');
          setPassword('');
          toast({
            title: "Check your email!",
            description: "We've sent you a confirmation link to complete your signup.",
          });
        } else if (data.user && data.session) {
          // Direct login (shouldn't happen with confirmations enabled)
          toast({
            title: "Account created!",
            description: "Welcome! You're now logged in.",
          });
          navigate('/dashboard');
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

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-xl opacity-50"></div>
                <img 
                  src={logo} 
                  alt="Daily Voice Journal" 
                  className="relative h-16 w-16 object-contain rounded-2xl bg-white/10 backdrop-blur-xl p-2 border border-white/10"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">Daily Voice Journal</h1>
            <p className="text-slate-400 mt-2">Your personal space for reflection</p>
          </div>

          <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
              <CardDescription className="text-slate-400">
                We've sent a confirmation link to <strong className="text-teal-400">{signUpEmail}</strong>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-sm text-slate-300">
                    Click the confirmation link in your email to activate your account. 
                    Once confirmed, you can sign in with your credentials.
                  </p>
                </div>
                
                <div className="text-xs text-slate-500">
                  <p>Didn't receive the email? Check your spam folder or</p>
                  <button 
                    onClick={() => {
                      setShowEmailConfirmation(false);
                      setIsLogin(false);
                      setEmail(signUpEmail);
                    }}
                    className="text-teal-400 hover:text-teal-300 underline"
                  >
                    try signing up again
                  </button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setIsLogin(true);
                  setSignUpEmail('');
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold h-11 rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/25"
              >
                Back to Sign In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-xl opacity-50"></div>
              <img 
                src={logo} 
                alt="Daily Voice Journal" 
                className="relative h-16 w-16 object-contain rounded-2xl bg-white/10 backdrop-blur-xl p-2 border border-white/10"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Daily Voice Journal</h1>
          <p className="text-slate-400 mt-2">Your personal space for reflection</p>
        </div>

        <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isLogin 
                ? 'Enter your credentials to access your journal' 
                : 'Start your journaling journey today'
              }
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
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
              
              <div className="flex items-center gap-4 w-full">
                <Separator className="flex-1 bg-white/10" />
                <span className="text-sm text-slate-500">or</span>
                <Separator className="flex-1 bg-white/10" />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setShowEmailConfirmation(false);
                }}
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
