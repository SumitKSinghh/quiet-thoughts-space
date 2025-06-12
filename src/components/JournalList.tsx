
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, CheckSquare, Loader2, BookOpen, Clock } from 'lucide-react';
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

  const getPreview = (content: string, maxLength: number = 180) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  const completedTodos = (todos: Todo[]) => {
    return todos.filter(todo => todo.completed).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-600 mx-auto mb-4" />
          <span className="text-lg text-slate-600 font-medium">Loading your journal entries...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-stone-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-slate-600 to-stone-600 rounded-xl shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-1">
                My Journal
              </h2>
              <p className="text-slate-600 font-medium">
                {format(selectedDate, 'MMMM yyyy')} • {journals.length} {journals.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>
          <div className="flex items-center text-slate-500 bg-white px-4 py-2 rounded-lg border">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-medium">{format(selectedDate, 'MMMM yyyy')}</span>
          </div>
        </div>
      </div>

      {journals.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-stone-100 rounded-full flex items-center justify-center mx-auto border-4 border-slate-200">
                <BookOpen className="h-10 w-10 text-slate-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-slate-300 to-stone-300 rounded-full"></div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-700 mb-3">No entries yet</h3>
            <p className="text-slate-500 leading-relaxed mb-6">
              Start your journaling journey by creating your first entry for {format(selectedDate, 'MMMM yyyy')}. 
              Document your thoughts, plans, and experiences.
            </p>
            
            <div className="bg-gradient-to-r from-slate-50 to-stone-50 rounded-xl p-6 border border-slate-200">
              <p className="text-sm text-slate-600 italic">
                "The best time to plant a tree was 20 years ago. The second best time is now." - Start writing today!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {journals.map((journal, index) => (
            <div key={journal.id} className="group">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden relative">
                {/* Decorative left border */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-400 via-stone-400 to-slate-500"></div>
                
                {/* Diary-style date tab */}
                <div className="absolute -right-2 top-6 bg-gradient-to-br from-slate-600 to-stone-600 text-white px-4 py-2 rounded-l-lg shadow-lg transform group-hover:scale-105 transition-transform">
                  <div className="text-xs font-semibold uppercase tracking-wider">
                    {format(new Date(journal.entry_date), 'MMM')}
                  </div>
                  <div className="text-lg font-bold">
                    {format(new Date(journal.entry_date), 'd')}
                  </div>
                </div>

                <CardHeader className="pb-4 pr-16">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-800 mb-2 leading-tight">
                        {journal.title || `Journal Entry`}
                      </CardTitle>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
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
                      className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 mt-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-0">
                  {/* Content with diary-style formatting */}
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 ml-6"></div>
                    <div className="pl-12 pr-4">
                      <p className="text-slate-700 leading-relaxed text-base font-medium">
                        {getPreview(journal.content)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Todo section with modern styling */}
                  {journal.todos && journal.todos.length > 0 && (
                    <div className="bg-gradient-to-r from-slate-50 to-stone-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <CheckSquare className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-700">Tasks Progress</span>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {completedTodos(journal.todos)} of {journal.todos.length} completed
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* Progress bar */}
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                              style={{ 
                                width: `${(completedTodos(journal.todos) / journal.todos.length) * 100}%` 
                              }}
                            />
                          </div>
                          
                          <Badge 
                            variant="secondary" 
                            className="bg-white text-slate-700 font-semibold shadow-sm"
                          >
                            {journal.todos.length} {journal.todos.length === 1 ? 'task' : 'tasks'}
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
};

export default JournalList;
