
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, CheckSquare, Loader2, BookOpen, Clock, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { format, isSameMonth, isBefore, isAfter, startOfMonth, endOfMonth } from 'date-fns';
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
  const currentDate = new Date();

  // Generate all 12 months for the current year
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(currentDate.getFullYear(), i, 1);
    return {
      date: monthDate,
      key: format(monthDate, 'MMMM yyyy'),
      shortName: format(monthDate, 'MMM'),
      year: format(monthDate, 'yyyy'),
      isCurrentMonth: isSameMonth(monthDate, currentDate),
      isPastMonth: isBefore(monthDate, startOfMonth(currentDate)),
      isFutureMonth: isAfter(monthDate, endOfMonth(currentDate))
    };
  });

  useEffect(() => {
    loadJournals();
  }, [selectedDate]);

  const loadJournals = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load journals for the entire year
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      const endOfYear = new Date(currentDate.getFullYear(), 11, 31);

      const { data: journalsData, error: journalsError } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', format(startOfYear, 'yyyy-MM-dd'))
        .lte('entry_date', format(endOfYear, 'yyyy-MM-dd'))
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

  const toggleFile = (monthKey: string, month: any) => {
    // Only allow expansion of current month
    if (!month.isCurrentMonth) {
      toast({
        title: "Access Restricted",
        description: month.isPastMonth 
          ? "Past journal entries are read-only" 
          : "Future months are not yet available",
        variant: "destructive",
      });
      return;
    }

    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedFiles(newExpanded);
  };

  const handleEditJournal = (journal: Journal) => {
    const journalDate = new Date(journal.entry_date);
    if (!isSameMonth(journalDate, currentDate)) {
      toast({
        title: "Edit Restricted",
        description: "You can only edit journal entries from the current month",
        variant: "destructive",
      });
      return;
    }
    onEditJournal(journal);
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
                📚 My Journal Library {currentDate.getFullYear()}
              </h2>
              <p className="text-amber-700 font-medium">
                Your personal collection • 12 monthly files
              </p>
            </div>
          </div>
          <div className="flex items-center text-amber-600 bg-white px-4 py-2 rounded-lg border-2 border-amber-200 shadow-sm">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-medium">{format(currentDate, 'MMMM yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Wooden Shelf with All 12 Months */}
      <div className="relative">
        {/* Shelf */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg shadow-lg border-2 border-amber-700"></div>
        <div className="absolute inset-x-0 bottom-2 h-2 bg-gradient-to-b from-amber-700 to-amber-800 rounded-sm"></div>
        
        <div className="grid grid-cols-6 gap-2 pb-12 px-4">
          {allMonths.map((month, index) => {
            const monthJournals = groupedJournals[month.key] || [];
            const isExpanded = expandedFiles.has(month.key);
            
            // Different colors for different states
            const fileColor = month.isCurrentMonth 
              ? 'from-green-600 to-green-800' 
              : month.isPastMonth 
                ? 'from-gray-500 to-gray-700' 
                : 'from-blue-400 to-blue-600';
            
            const tiltAngle = (index % 2 === 0) ? 'rotate-2' : '-rotate-1';
            
            return (
              <div key={month.key} className="relative">
                {/* File Spine on Shelf */}
                <div className="relative mb-6">
                  <button
                    onClick={() => toggleFile(month.key, month)}
                    className="group relative w-full"
                    disabled={!month.isCurrentMonth}
                  >
                    {/* File Spine - Tilted */}
                    <div className={`w-16 h-48 bg-gradient-to-b ${fileColor} rounded-t-lg shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-l-4 border-r-4 border-opacity-30 border-white relative ${tiltAngle} ${!month.isCurrentMonth ? 'opacity-70' : ''}`}>
                      {/* Lock Icon for Restricted Months */}
                      {!month.isCurrentMonth && (
                        <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-md">
                          <Lock className="h-3 w-3 text-white" />
                        </div>
                      )}
                      
                      {/* File Label */}
                      <div className="absolute inset-x-0 top-3 px-1">
                        <div className="bg-white bg-opacity-90 rounded-sm p-1.5 shadow-sm">
                          <div className="text-xs font-bold text-gray-800 text-center leading-tight">
                            {month.shortName}
                          </div>
                          <div className="text-xs text-gray-600 text-center">
                            {month.year}
                          </div>
                        </div>
                      </div>
                      
                      {/* Page Count */}
                      <div className="absolute bottom-3 inset-x-0 px-1">
                        <div className="bg-white bg-opacity-90 rounded-sm p-1 text-xs text-center text-gray-700 font-semibold">
                          {monthJournals.length}
                        </div>
                      </div>
                      
                      {/* Current Month Indicator */}
                      {month.isCurrentMonth && (
                        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-2 h-2 bg-yellow-400 rounded-full shadow-md animate-pulse"></div>
                      )}
                      
                      {/* Expansion Icon - Only for Current Month */}
                      {month.isCurrentMonth && (
                        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md group-hover:bg-gray-100 transition-colors">
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-gray-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
                
                {/* Expanded Pages - Only for Current Month */}
                {isExpanded && month.isCurrentMonth && monthJournals.length > 0 && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 z-10 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-2xl border-2 border-gray-200 mt-2">
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-gray-800 text-center border-b pb-2">
                        {month.key} Entries
                      </h3>
                      
                      {monthJournals.map((journal, index) => (
                        <div key={journal.id} className="group relative">
                          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden relative transform hover:-translate-y-0.5">
                            {/* Page Corner Fold */}
                            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-bl from-gray-300 to-transparent"></div>
                            
                            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-sm font-bold text-gray-800 mb-1 leading-tight">
                                    📝 {journal.title || `Entry ${index + 1}`}
                                  </CardTitle>
                                  
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <div className="flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      <span className="font-medium">{formatDate(journal.entry_date)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <Button
                                  onClick={() => handleEditJournal(journal)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-2 pt-2">
                              {/* Content Preview */}
                              <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-px bg-red-200 ml-4"></div>
                                <div className="pl-6 pr-2">
                                  <p className="text-gray-700 leading-relaxed text-xs">
                                    {getPreview(journal.content, 80)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Todo section */}
                              {journal.todos && journal.todos.length > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <CheckSquare className="h-3 w-3 text-blue-600" />
                                      <span className="text-xs font-semibold text-blue-700">
                                        {completedTodos(journal.todos)}/{journal.todos.length} tasks
                                      </span>
                                    </div>
                                    
                                    <Badge variant="secondary" className="bg-white text-blue-700 text-xs">
                                      {journal.todos.length}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                      
                      {monthJournals.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No entries for this month yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-green-600 to-green-800 rounded"></div>
            <span>Current Month</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-gray-500 to-gray-700 rounded opacity-70"></div>
            <span>Past Months</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-blue-400 to-blue-600 rounded opacity-70"></div>
            <span>Future Months</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalList;
