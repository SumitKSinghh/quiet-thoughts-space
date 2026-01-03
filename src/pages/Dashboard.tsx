import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import QuickStatsGrid from '@/components/dashboard/QuickStatsGrid';
import GamifiedGoalsCalendar from '@/components/dashboard/GamifiedGoalsCalendar';
import CompactCalendar from '@/components/dashboard/CompactCalendar';
import CompactTodoList from '@/components/dashboard/CompactTodoList';

// Feature Components
import JournalEditorSimple from '@/components/JournalEditorSimple';
import JournalList from '@/components/JournalList';
import { JournalSearch } from '@/components/JournalSearch';
import { JournalSearchResults } from '@/components/JournalSearchResults';
import VoiceJournal from '@/components/VoiceJournal';
import GoalTracker from '@/components/GoalTracker';
import MoodInsights from '@/components/MoodInsights';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import AIChatPanel from '@/components/AIChatPanel';
import FrequencySidebar from '@/components/FrequencySidebar';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ViewType = 'home' | 'list' | 'create' | 'edit' | 'voice' | 'goals' | 'insights' | 'search' | 'ai-insights' | 'ai-chat';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<ViewType>('home');
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
        
        const { data: journals, error: journalsError } = await supabase
          .from('journals')
          .select('id, title, content, entry_date, mood, created_at')
          .eq('user_id', session.user.id)
          .order('entry_date', { ascending: false });

        if (journalsError) {
          console.error('Error loading journals:', journalsError);
        }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          navigate('/login', { replace: true });
        }
      } else if (event === 'SIGNED_IN' && !isInitialized) {
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

  const handleBackToHome = () => {
    setActiveView('home');
    setSelectedJournal(null);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view as ViewType);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/20 mx-auto mb-6 w-fit">
            <BookOpen className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <BookOpen className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Dashboard Error</h2>
          <p className="text-slate-500 mb-6">{authError}</p>
          <Button 
            onClick={() => {
              setAuthError(null);
              navigate('/login', { replace: true });
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/20 mx-auto mb-6 w-fit">
            <BookOpen className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-500 font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <DashboardHeader 
        activeView={activeView}
        onViewChange={handleViewChange}
        onCreateNew={handleCreateNew}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Home View - Modern Dashboard */}
        {activeView === 'home' && (
          <>
            {/* Quick Stats */}
            <QuickStatsGrid />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Calendar & Tasks */}
              <div className="lg:col-span-1 space-y-6">
                <CompactCalendar 
                  selectedDate={selectedDate} 
                  onDateSelect={setSelectedDate} 
                />
                <CompactTodoList />
              </div>

              {/* Right Column - Gamified Goals */}
              <div className="lg:col-span-3">
                <GamifiedGoalsCalendar />

                {/* Recent Entries Preview */}
                <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Recent Entries</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveView('list')}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      View All
                    </Button>
                  </div>
                  
                  {allJournals.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No entries yet. Start your journaling journey!</p>
                      <Button 
                        onClick={handleCreateNew}
                        className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600"
                      >
                        Create First Entry
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allJournals.slice(0, 3).map((journal) => (
                        <div
                          key={journal.id}
                          onClick={() => handleEditJournal(journal)}
                          className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-slate-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">
                              {new Date(journal.entry_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            {journal.mood && (
                              <span className="text-lg">
                                {journal.mood === 'excellent' && '😄'}
                                {journal.mood === 'good' && '😊'}
                                {journal.mood === 'neutral' && '😐'}
                                {journal.mood === 'bad' && '😞'}
                                {journal.mood === 'terrible' && '😢'}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-slate-800 truncate">
                            {journal.title || 'Untitled Entry'}
                          </h4>
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                            {journal.content?.substring(0, 100) || 'No content...'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Other Views */}
        {activeView === 'list' && (
          <JournalList
            selectedDate={selectedDate}
            onEditJournal={handleEditJournal}
          />
        )}

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
        
        {(activeView === 'create' || activeView === 'edit') && (
          <JournalEditorSimple
            journal={selectedJournal}
            selectedDate={selectedDate}
            onBack={handleBackToHome}
            onSave={handleBackToHome}
          />
        )}
        
        {activeView === 'voice' && (
          <VoiceJournal onSave={handleBackToHome} />
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
      </main>

      <FrequencySidebar />
    </div>
  );
};

export default Dashboard;
