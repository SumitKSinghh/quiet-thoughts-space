import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import QuickStatsGrid from '@/components/dashboard/QuickStatsGrid';
import GamifiedGoalsCalendar from '@/components/dashboard/GamifiedGoalsCalendar';
import CompactCalendar from '@/components/dashboard/CompactCalendar';
import CompactTodoList from '@/components/dashboard/CompactTodoList';

// Feature Components - lazy loaded for better code splitting
const JournalEditorSimple = React.lazy(() => import('@/components/JournalEditorSimple'));
const JournalList = React.lazy(() => import('@/components/JournalList'));
const JournalSearch = React.lazy(() => import('@/components/JournalSearch').then(m => ({ default: m.JournalSearch })));
const JournalSearchResults = React.lazy(() => import('@/components/JournalSearchResults').then(m => ({ default: m.JournalSearchResults })));
const VoiceJournal = React.lazy(() => import('@/components/VoiceJournal'));
const GoalTracker = React.lazy(() => import('@/components/GoalTracker'));
const MoodInsights = React.lazy(() => import('@/components/MoodInsights'));
const AIInsightsPanel = React.lazy(() => import('@/components/AIInsightsPanel'));
const AIChatPanel = React.lazy(() => import('@/components/AIChatPanel'));
const HourLogger = React.lazy(() => import('@/components/HourLogger'));

import FrequencySidebar from '@/components/FrequencySidebar';
import { PremiumGate } from '@/components/PremiumGate';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { format } from 'date-fns';

type ViewType = 'home' | 'list' | 'create' | 'edit' | 'voice' | 'goals' | 'insights' | 'search' | 'ai-insights' | 'ai-chat' | 'hours';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [allJournals, setAllJournals] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
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

        const currentUserId = session.user.id;
        if (isMounted) setUserId(currentUserId);
        
        // Fetch journals and smart tags in parallel
        const [journalsRes, tagsRes] = await Promise.all([
          supabase
            .from('journals')
            .select('id, title, content, entry_date, mood, created_at')
            .eq('user_id', currentUserId)
            .order('entry_date', { ascending: false }),
          supabase
            .from('journal_smart_tags')
            .select('journal_id, tag_type, tag_value, confidence_score')
            .eq('user_id', currentUserId)
        ]);

        if (journalsRes.error) {
          console.error('Error loading journals:', journalsRes.error);
        }

        if (isMounted) {
          const journals = journalsRes.data || [];
          const smartTags = tagsRes.data || [];

          const journalsWithTags = journals.map(journal => ({
            ...journal,
            smart_tags: smartTags.filter(tag => tag.journal_id === journal.id)
          }));

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
    if (view !== 'list') setSelectedMonth(null);
    setActiveView(view as ViewType);
  };

  // Memoize recent journals to avoid recalculation
  const recentJournals = useMemo(() => allJournals.slice(0, 3), [allJournals]);

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

  const LazyFallback = (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse text-slate-400">Loading...</div>
    </div>
  );

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
            <QuickStatsGrid userId={userId!} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Calendar & Tasks */}
              <div className="lg:col-span-1 space-y-6">
                <CompactCalendar 
                  selectedDate={selectedDate} 
                  onDateSelect={setSelectedDate} 
                />
                <CompactTodoList userId={userId!} />
              </div>

              {/* Right Column - Gamified Goals */}
              <div className="lg:col-span-3">
                <GamifiedGoalsCalendar 
                  userId={userId!} 
                  onMonthClick={(month) => {
                    setSelectedMonth(format(month, 'MMMM yyyy'));
                    setActiveView('list');
                  }}
                />

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
                      {recentJournals.map((journal) => (
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
          <React.Suspense fallback={LazyFallback}>
            <JournalList
              selectedDate={selectedDate}
              onEditJournal={handleEditJournal}
              initialMonth={selectedMonth}
            />
          </React.Suspense>
        )}

        {activeView === 'search' && (
          <React.Suspense fallback={LazyFallback}>
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
          </React.Suspense>
        )}
        
        {(activeView === 'create' || activeView === 'edit') && (
          <React.Suspense fallback={LazyFallback}>
            <JournalEditorSimple
              journal={selectedJournal}
              selectedDate={selectedDate}
              onBack={handleBackToHome}
              onSave={handleBackToHome}
            />
          </React.Suspense>
        )}
        
        {activeView === 'voice' && (
          <React.Suspense fallback={LazyFallback}>
            <VoiceJournal onSave={handleBackToHome} />
          </React.Suspense>
        )}
        
        {activeView === 'goals' && (
          <React.Suspense fallback={LazyFallback}>
            <GoalTracker />
          </React.Suspense>
        )}
        
        {activeView === 'insights' && (
          <React.Suspense fallback={LazyFallback}>
            <MoodInsights />
          </React.Suspense>
        )}
        
        {activeView === 'ai-insights' && (
          <React.Suspense fallback={LazyFallback}>
            <PremiumGate feature="AI Insights">
              <AIInsightsPanel />
            </PremiumGate>
          </React.Suspense>
        )}
        
        {activeView === 'ai-chat' && (
          <React.Suspense fallback={LazyFallback}>
            <AIChatPanel />
          </React.Suspense>
        )}


        {activeView === 'hours' && (
          <React.Suspense fallback={LazyFallback}>
            <HourLogger />
          </React.Suspense>
        )}
      </main>

      <FrequencySidebar />
    </div>
  );
};

export default Dashboard;
