
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BookOpen, LogOut, User } from 'lucide-react';
import JournalEditor from '@/components/JournalEditor';
import JournalList from '@/components/JournalList';
import CalendarSidebar from '@/components/CalendarSidebar';
import TodoSidebar from '@/components/TodoSidebar';
import UnfinishedTasks from '@/components/UnfinishedTasks';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('User authenticated, session valid');
        setIsLoading(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        navigate('/login');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleCreateNew = () => {
    console.log('=== NEW ENTRY BUTTON CLICKED ===');
    console.log('Current state before changes:');
    console.log('- activeView:', activeView);
    console.log('- selectedDate:', selectedDate);
    console.log('- selectedJournal:', selectedJournal);
    
    try {
      console.log('Setting selectedJournal to null...');
      setSelectedJournal(null);
      
      console.log('Setting activeView to create...');
      setActiveView('create');
      
      console.log('State changes completed successfully');
      console.log('New state should be:');
      console.log('- activeView: create');
      console.log('- selectedJournal: null');
    } catch (error) {
      console.error('ERROR in handleCreateNew:', error);
    }
  };

  const handleEditJournal = (journal: any) => {
    setSelectedJournal(journal);
    setActiveView('edit');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedJournal(null);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong while logging out.",
        variant: "destructive",
      });
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-600 via-gray-600 to-stone-600 shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-white drop-shadow-md" />
              <h1 className="text-2xl font-bold text-white drop-shadow-md">Daily Journal</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
              
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unfinished Tasks Section */}
        <div className="mb-6">
          <UnfinishedTasks />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Left Sidebar - Calendar */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <CalendarSidebar 
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              <TodoSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {(() => {
              console.log('=== DASHBOARD RENDERING MAIN CONTENT ===');
              console.log('Current activeView:', activeView);
              console.log('selectedJournal:', selectedJournal);
              console.log('selectedDate:', selectedDate);
              return null;
            })()}
            
            {activeView === 'list' && (
              <>
                {(() => {
                  console.log('Rendering JournalList');
                  return null;
                })()}
                <JournalList
                  selectedDate={selectedDate}
                  onEditJournal={handleEditJournal}
                />
              </>
            )}
            
            {(activeView === 'create' || activeView === 'edit') && (
              <>
                {(() => {
                  console.log('Rendering JournalEditor with props:', { 
                    journal: selectedJournal, 
                    selectedDate, 
                    activeView 
                  });
                  return null;
                })()}
                <JournalEditor
                  journal={selectedJournal}
                  selectedDate={selectedDate}
                  onBack={handleBackToList}
                  onSave={handleBackToList}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
