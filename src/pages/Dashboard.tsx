
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BookOpen, LogOut, User, Mic, Target, BarChart3, Search, Users, Brain, MessageCircle } from 'lucide-react';
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
import FrequencySidebar from '@/components/FrequencySidebar';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import AIChatPanel from '@/components/AIChatPanel';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'voice' | 'goals' | 'insights' | 'search' | 'ai-insights' | 'ai-chat'>('list');
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
          .select('id, title, content, entry_date, mood, created_at')
          .eq('user_id', session.user.id)
          .order('entry_date', { ascending: false });

        if (journalsError) {
          console.error('Error loading journals:', journalsError);
          // Don't fail the entire dashboard for journal loading errors
        }

        // Load smart tags separately
        let smartTags: any[] = [];
        if (journals && journals.length > 0) {
          const { data: tagsData } = await supabase
            .from('journal_smart_tags')
            .select('journal_id, tag_type, tag_value, confidence_score')
            .eq('user_id', session.user.id);
          
          smartTags = tagsData || [];
        }

        if (isMounted) {
          const journalsWithTags = journals?.map(journal => ({
            ...journal,
            smart_tags: smartTags.filter(tag => tag.journal_id === journal.id)
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
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-xl border-b border-slate-600/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg shadow-md">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">Daily Journal</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {/* Primary Action */}
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Entry
              </Button>
              
              {/* Separator */}
              <div className="w-px h-6 bg-slate-600 mx-2" />
              
              {/* Journal Tools */}
              <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-0.5">
                <Button
                  onClick={() => setActiveView('voice')}
                  variant="ghost"
                  size="sm"
                  className={`text-slate-300 hover:text-white hover:bg-slate-600/80 transition-colors ${
                    activeView === 'voice' ? 'bg-slate-600 text-white' : ''
                  }`}
                >
                  <Mic className="h-4 w-4 mr-1.5" />
                  Voice
                </Button>
                
                <Button
                  onClick={() => setActiveView('goals')}
                  variant="ghost"
                  size="sm"
                  className={`text-slate-300 hover:text-white hover:bg-slate-600/80 transition-colors ${
                    activeView === 'goals' ? 'bg-slate-600 text-white' : ''
                  }`}
                >
                  <Target className="h-4 w-4 mr-1.5" />
                  Goals
                </Button>
                
                <Button
                  onClick={() => setActiveView('insights')}
                  variant="ghost"
                  size="sm"
                  className={`text-slate-300 hover:text-white hover:bg-slate-600/80 transition-colors ${
                    activeView === 'insights' ? 'bg-slate-600 text-white' : ''
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Mood
                </Button>
              </div>
              
              {/* Separator */}
              <div className="w-px h-6 bg-slate-600 mx-2" />
              
              {/* AI Features */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-lg p-0.5 border border-violet-500/30">
                <Button
                  onClick={() => setActiveView('ai-insights')}
                  variant="ghost"
                  size="sm"
                  className={`text-violet-300 hover:text-white hover:bg-violet-600/50 transition-colors ${
                    activeView === 'ai-insights' ? 'bg-violet-600/70 text-white' : ''
                  }`}
                >
                  <Brain className="h-4 w-4 mr-1.5" />
                  Insights
                </Button>
                
                <Button
                  onClick={() => setActiveView('ai-chat')}
                  variant="ghost"
                  size="sm"
                  className={`text-violet-300 hover:text-white hover:bg-violet-600/50 transition-colors ${
                    activeView === 'ai-chat' ? 'bg-violet-600/70 text-white' : ''
                  }`}
                >
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  Chat
                </Button>
              </div>
              
              {/* Separator */}
              <div className="w-px h-6 bg-slate-600 mx-2" />
              
              {/* Utilities */}
              <Button
                onClick={() => setActiveView('search')}
                variant="ghost"
                size="sm"
                className={`text-slate-300 hover:text-white hover:bg-slate-600/80 transition-colors ${
                  activeView === 'search' ? 'bg-slate-600 text-white' : ''
                }`}
              >
                <Search className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => navigate('/community')}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-600/80 transition-colors"
              >
                <Users className="h-4 w-4" />
              </Button>
              
              {/* Separator */}
              <div className="w-px h-6 bg-slate-600 mx-2" />
              
              {/* User Actions */}
              <Button
                onClick={() => navigate('/profile')}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-600/80 transition-colors"
              >
                <User className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </nav>
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
            
            {activeView === 'ai-insights' && (
              <AIInsightsPanel />
            )}
            
            {activeView === 'ai-chat' && (
              <AIChatPanel />
            )}
          </div>
        </div>
      </div>
      <FrequencySidebar />
    </div>
  );
};

export default Dashboard;
