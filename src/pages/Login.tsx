
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Journal</h1>
            <p className="text-gray-600 mt-2">Your personal space for reflection</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a confirmation link to <strong>{signUpEmail}</strong>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Click the confirmation link in your email to activate your account. 
                    Once confirmed, you can sign in with your credentials.
                  </p>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>Didn't receive the email? Check your spam folder or</p>
                  <button 
                    onClick={() => {
                      setShowEmailConfirmation(false);
                      setIsLogin(false);
                      setEmail(signUpEmail);
                    }}
                    className="text-blue-600 hover:text-blue-700 underline"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Journal</h1>
          <p className="text-gray-600 mt-2">Your personal space for reflection</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isLogin ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Enter your credentials to access your journal' 
                : 'Start your journaling journey today'
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
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </Button>
              
              <div className="flex items-center space-x-4 w-full">
                <Separator className="flex-1" />
                <span className="text-sm text-gray-500">or</span>
                <Separator className="flex-1" />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
