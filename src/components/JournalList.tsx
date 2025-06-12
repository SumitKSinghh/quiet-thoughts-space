
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, CheckSquare, Loader2, BookOpen, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
}

interface Journal {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  created_at: string;
  todos: Todo[];
}

interface JournalListProps {
  selectedDate: Date;
  onEditJournal: (journal: Journal) => void;
}

const JournalList = ({ selectedDate, onEditJournal }: JournalListProps) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadJournals();
  }, [selectedDate]);

  const loadJournals = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the selected month's start and end dates
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data: journalsData, error: journalsError } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', format(startOfMonth, 'yyyy-MM-dd'))
        .lte('entry_date', format(endOfMonth, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: false });

      if (journalsError) throw journalsError;

      // Load todos for each journal
      const journalsWithTodos = await Promise.all(
        (journalsData || []).map(async (journal) => {
          const { data: todosData, error: todosError } = await supabase
            .from('todos')
            .select('*')
            .eq('journal_id', journal.id)
            .order('created_at');

          if (todosError) {
            console.error('Error loading todos for journal:', journal.id, todosError);
            return { ...journal, todos: [] };
          }

          return { ...journal, todos: todosData || [] };
        })
      );

      setJournals(journalsWithTodos);
    } catch (error: any) {
      console.error('Error loading journals:', error);
      toast({
        title: "Error loading journals",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const getPreview = (content: string, maxLength: number = 120) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  const completedTodos = (todos: Todo[]) => {
    return todos.filter(todo => todo.completed).length;
  };

  // Group journals by month
  const groupedJournals = journals.reduce((groups, journal) => {
    const monthKey = format(new Date(journal.entry_date), 'MMMM yyyy');
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(journal);
    return groups;
  }, {} as Record<string, Journal[]>);

  const toggleFile = (monthKey: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedFiles(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-600 mx-auto mb-4" />
          <span className="text-lg text-slate-600 font-medium">Loading your journal collection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Library Header */}
      <div className="relative">
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-amber-800 mb-1">
                📚 My Journal Library
              </h2>
              <p className="text-amber-700 font-medium">
                Your personal collection • {Object.keys(groupedJournals).length} {Object.keys(groupedJournals).length === 1 ? 'file' : 'files'}
              </p>
            </div>
          </div>
          <div className="flex items-center text-amber-600 bg-white px-4 py-2 rounded-lg border-2 border-amber-200 shadow-sm">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-medium">{format(selectedDate, 'MMMM yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Wooden Shelf Background */}
      <div className="relative">
        {/* Shelf */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg shadow-lg border-2 border-amber-700"></div>
        <div className="absolute inset-x-0 bottom-2 h-2 bg-gradient-to-b from-amber-700 to-amber-800 rounded-sm"></div>
        
        {Object.keys(groupedJournals).length === 0 ? (
          <div className="text-center py-24 relative">
            <div className="max-w-md mx-auto">
              <div className="relative mb-8">
                <div className="w-32 h-40 bg-gradient-to-b from-slate-200 to-slate-300 rounded-lg flex items-center justify-center mx-auto border-4 border-slate-400 shadow-lg transform rotate-2">
                  <BookOpen className="h-16 w-16 text-slate-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full shadow-md"></div>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-700 mb-3">Empty Shelf</h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Your journal library is waiting for its first entry. Start documenting your journey today!
              </p>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                <p className="text-sm text-amber-700 italic">
                  "Every great journey begins with a single step..." - Create your first journal entry!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-12">
            {Object.entries(groupedJournals).map(([monthKey, monthJournals]) => {
              const isExpanded = expandedFiles.has(monthKey);
              const fileColor = monthJournals.length > 10 ? 'from-red-600 to-red-800' : 
                               monthJournals.length > 5 ? 'from-blue-600 to-blue-800' : 
                               'from-green-600 to-green-800';
              
              return (
                <div key={monthKey} className="relative">
                  {/* File Spine on Shelf */}
                  <div className="relative mb-6">
                    <button
                      onClick={() => toggleFile(monthKey)}
                      className="group relative"
                    >
                      {/* File Spine */}
                      <div className={`w-20 h-64 bg-gradient-to-b ${fileColor} rounded-t-lg shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-l-4 border-r-4 border-opacity-30 border-white relative`}>
                        {/* File Label */}
                        <div className="absolute inset-x-0 top-4 px-2">
                          <div className="bg-white bg-opacity-90 rounded-sm p-2 shadow-sm">
                            <div className="text-xs font-bold text-gray-800 text-center leading-tight">
                              {monthKey.split(' ')[0]}
                            </div>
                            <div className="text-xs text-gray-600 text-center">
                              {monthKey.split(' ')[1]}
                            </div>
                          </div>
                        </div>
                        
                        {/* Page Count */}
                        <div className="absolute bottom-4 inset-x-0 px-2">
                          <div className="bg-white bg-opacity-90 rounded-sm p-1 text-xs text-center text-gray-700 font-semibold">
                            {monthJournals.length} {monthJournals.length === 1 ? 'page' : 'pages'}
                          </div>
                        </div>
                        
                        {/* Expansion Icon */}
                        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md group-hover:bg-gray-100 transition-colors">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Expanded Pages */}
                  {isExpanded && (
                    <div className="space-y-4 ml-24 animate-fade-in">
                      {monthJournals.map((journal, index) => (
                        <div key={journal.id} className="group relative">
                          {/* Page Card */}
                          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 overflow-hidden relative transform hover:-translate-y-1">
                            {/* Page Corner Fold */}
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-gray-300 to-transparent"></div>
                            
                            {/* Page Header */}
                            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg font-bold text-gray-800 mb-2 leading-tight">
                                    📝 {journal.title || `Entry ${index + 1}`}
                                  </CardTitle>
                                  
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1.5" />
                                      <span className="font-medium">{formatDate(journal.entry_date)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1.5" />
                                      <span>{formatTime(journal.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <Button
                                  onClick={() => onEditJournal(journal)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-4 pt-4">
                              {/* Content with handwriting style */}
                              <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-px bg-red-200 ml-8"></div>
                                <div className="pl-12 pr-4">
                                  <p className="text-gray-700 leading-relaxed text-base font-medium">
                                    {getPreview(journal.content)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Todo section */}
                              {journal.todos && journal.todos.length > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <CheckSquare className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <span className="text-sm font-semibold text-blue-700">Tasks</span>
                                        <div className="text-xs text-blue-500 mt-0.5">
                                          {completedTodos(journal.todos)} of {journal.todos.length} completed
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                      {/* Progress bar */}
                                      <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                                          style={{ 
                                            width: `${(completedTodos(journal.todos) / journal.todos.length) * 100}%` 
                                          }}
                                        />
                                      </div>
                                      
                                      <Badge 
                                        variant="secondary" 
                                        className="bg-white text-blue-700 font-semibold shadow-sm"
                                      >
                                        {journal.todos.length}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalList;
