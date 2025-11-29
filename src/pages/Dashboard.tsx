
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BookOpen, LogOut, User, Mic, Target, BarChart3, Search, Users } from 'lucide-react';
import JournalEditorSimple from '@/components/JournalEditorSimple';
import JournalList from '@/components/JournalList';
import { JournalSearch } from '@/components/JournalSearch';
import { JournalSearchResults } from '@/components/JournalSearchResults';
import CalendarSidebar from '@/components/CalendarSidebar';
import TodoSidebar from '@/components/TodoSidebar';
import UnfinishedTasks from '@/components/UnfinishedTasks';
import VoiceJournal from '@/components/VoiceJournal';
import GoalTracker from '@/components/GoalTracker';
import MoodInsights from '@/components/MoodInsights';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'voice' | 'goals' | 'insights' | 'search'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [allJournals, setAllJournals] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Combined authentication and data loading
  useEffect(() => {
    let isMounted = true;
    
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        setAuthError(null);
        
        // Check authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Authentication error: ${sessionError.message}`);
        }

        if (!session?.user) {
          if (isMounted) {
            navigate('/login', { replace: true });
          }
          return;
        }
        
        // Load journals data
        const { data: journals, error: journalsError } = await supabase
          .from('journals')
          .select(`
            id, title, content, entry_date, mood, created_at,
            journal_smart_tags (tag_type, tag_value, confidence_score)
          `)
          .eq('user_id', session.user.id)
          .order('entry_date', { ascending: false });

        if (journalsError) {
          console.error('Error loading journals:', journalsError);
          // Don't fail the entire dashboard for journal loading errors
        }

        if (isMounted) {
          const journalsWithTags = journals?.map(journal => ({
            ...journal,
            smart_tags: journal.journal_smart_tags || []
          })) || [];

          setAllJournals(journalsWithTags);
          setSearchResults(journalsWithTags);
          setIsInitialized(true);
        }

      } catch (error: any) {
        console.error('Dashboard initialization failed:', error);
        
        if (isMounted) {
          setAuthError(error.message || 'Failed to load dashboard');
          
          // If it's an auth error, redirect to login
          if (error.message?.includes('authentication') || error.message?.includes('session')) {
            toast({
              title: "Session expired",
              description: "Please log in again.",
              variant: "destructive",
            });
            navigate('/login', { replace: true });
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeDashboard();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          navigate('/login', { replace: true });
        }
      } else if (event === 'SIGNED_IN' && !isInitialized) {
        // Reload dashboard if user signs in and dashboard isn't initialized
        initializeDashboard();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast, isInitialized]);

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    if (activeView !== 'search') {
      setActiveView('search');
    }
  };

  const handleSelectSearchResult = (journal: any) => {
    setSelectedJournal(journal);
    setActiveView('edit');
  };

  const handleCreateNew = () => {
    setSelectedJournal(null);
    setActiveView('create');
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

  // Show loading screen while checking authentication and loading data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error screen if there's an authentication or loading error
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <BookOpen className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <Button 
            onClick={() => {
              setAuthError(null);
              navigate('/login', { replace: true });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Only render dashboard if we're initialized and authenticated
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Initializing dashboard...</p>
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
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
              
              <Button
                onClick={() => setActiveView('voice')}
                variant={activeView === 'voice' ? 'secondary' : 'outline'}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                size="sm"
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </Button>
              
              <Button
                onClick={() => setActiveView('goals')}
                variant={activeView === 'goals' ? 'secondary' : 'outline'}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                size="sm"
              >
                <Target className="h-4 w-4 mr-2" />
                Goals
              </Button>
              
              <Button
                onClick={() => setActiveView('insights')}
                variant={activeView === 'insights' ? 'secondary' : 'outline'}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Insights
              </Button>
              
              <Button
                onClick={() => setActiveView('search')}
                variant={activeView === 'search' ? 'secondary' : 'outline'}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              
              <Button
                onClick={() => navigate('/community')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Community
              </Button>
              
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                size="sm"
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
            
            {activeView === 'search' && (
              <div className="space-y-6">
                <JournalSearch
                  onResults={handleSearchResults}
                  allEntries={allJournals}
                />
                <JournalSearchResults
                  results={searchResults}
                  onSelectJournal={handleSelectSearchResult}
                />
              </div>
            )}
            
            {activeView === 'list' && (
              <>
                <JournalList
                  selectedDate={selectedDate}
                  onEditJournal={handleEditJournal}
                />
              </>
            )}
            
            {(activeView === 'create' || activeView === 'edit') && (
              <>
                <JournalEditorSimple
                  journal={selectedJournal}
                  selectedDate={selectedDate}
                  onBack={handleBackToList}
                  onSave={handleBackToList}
                />
              </>
            )}
            
            {activeView === 'voice' && (
              <VoiceJournal onSave={handleBackToList} />
            )}
            
            {activeView === 'goals' && (
              <GoalTracker />
            )}
            
            {activeView === 'insights' && (
              <MoodInsights />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
