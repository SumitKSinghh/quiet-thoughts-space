
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import ProfileForm from '@/components/ProfileForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please log in to access your profile.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        
        setUser(user);
      } catch (error: any) {
        console.error('Auth check error:', error);
        toast({
          title: "Error",
          description: "Failed to verify authentication.",
          variant: "destructive",
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-600 via-gray-600 to-stone-600 shadow-lg border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-white drop-shadow-md" />
              <h1 className="text-2xl font-bold text-white drop-shadow-md">Profile Settings</h1>
            </div>
            
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-xl border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 border-b border-slate-200">
            <CardTitle className="text-2xl text-slate-700">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ProfileForm user={user} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
