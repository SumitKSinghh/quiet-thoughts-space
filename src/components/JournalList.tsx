import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, CheckSquare, Loader2, BookOpen, Clock, ChevronDown, ChevronRight, Lock, ArrowLeft } from 'lucide-react';
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
  const [fullViewMonth, setFullViewMonth] = useState<string | null>(null);
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
    // Restrict access to future months only
    if (month.isFutureMonth) {
      toast({
        title: "Access Restricted",
        description: "Future months are not yet available",
        variant: "destructive",
      });
      return;
    }

    // Toggle full view mode
    if (fullViewMonth === monthKey) {
      setFullViewMonth(null);
    } else {
      setFullViewMonth(monthKey);
    }
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

  // Full view mode for expanded month
  if (fullViewMonth) {
    const monthJournals = groupedJournals[fullViewMonth] || [];
    
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setFullViewMonth(null)}
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-amber-800 mb-1">
                  📁 {fullViewMonth} Journals
                </h2>
                <p className="text-amber-700 font-medium">
                  {monthJournals.length} {monthJournals.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full journal list */}
        <div className="grid gap-6">
          {monthJournals.length > 0 ? (
            monthJournals.map((journal, index) => (
              <Card key={journal.id} className="group relative bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 overflow-hidden">
                {/* Page Corner Fold */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-gray-300 to-transparent"></div>
                
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-800 mb-2 leading-tight">
                        📝 {journal.title || `Journal Entry ${index + 1}`}
                      </CardTitle>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="font-medium">{formatDate(journal.entry_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatTime(journal.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleEditJournal(journal)}
                      variant="outline"
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-6">
                  {/* Full Content */}
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-300 ml-6"></div>
                    <div className="pl-10 pr-4">
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {journal.content}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Todo section */}
                  {journal.todos && journal.todos.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                          <span className="text-lg font-semibold text-blue-800">
                            Tasks ({completedTodos(journal.todos)}/{journal.todos.length} completed)
                          </span>
                        </div>
                        
                        <Badge variant="secondary" className="bg-white text-blue-700 px-3 py-1">
                          {journal.todos.length} {journal.todos.length === 1 ? 'task' : 'tasks'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {journal.todos.map((todo) => (
                          <div key={todo.id} className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-blue-100">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              todo.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300'
                            }`}>
                              {todo.completed && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className={`flex-1 ${
                              todo.completed 
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-800'
                            }`}>
                              {todo.task}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <BookOpen className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No entries for {fullViewMonth}</h3>
              <p className="text-gray-500">Start writing your thoughts and experiences!</p>
            </div>
          )}
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
                    disabled={month.isFutureMonth}
                  >
                    {/* File Spine - Tilted */}
                    <div className={`w-16 h-48 bg-gradient-to-b ${fileColor} rounded-t-lg shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-l-4 border-r-4 border-opacity-30 border-white relative ${tiltAngle} ${month.isFutureMonth ? 'opacity-50' : ''}`}>
                      {/* Lock Icon for Future Months Only */}
                      {month.isFutureMonth && (
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
                      
                      {/* Expansion Icon - For Current and Past Months */}
                      {!month.isFutureMonth && (
                        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md group-hover:bg-gray-100 transition-colors">
                          <ChevronRight className="h-3 w-3 text-gray-600" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-green-600 to-green-800 rounded"></div>
            <span>Current Month (Click to Expand)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-gray-500 to-gray-700 rounded"></div>
            <span>Past Months (Read-only)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-blue-400 to-blue-600 rounded opacity-50"></div>
            <span>Future Months (Locked)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalList;
