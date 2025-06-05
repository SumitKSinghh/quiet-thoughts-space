
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, CheckSquare, Loader2 } from 'lucide-react';
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

  const getPreview = (content: string, maxLength: number = 150) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  const completedTodos = (todos: Todo[]) => {
    return todos.filter(todo => todo.completed).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading your journals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Journal Entries
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          {format(selectedDate, 'MMMM yyyy')}
        </div>
      </div>

      {journals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500 mb-4">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No entries found</h3>
              <p>Start your journaling journey by creating your first entry for {format(selectedDate, 'MMMM yyyy')}.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {journals.map((journal) => (
            <Card key={journal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {journal.title || formatDate(journal.entry_date)}
                  </CardTitle>
                  <Button
                    onClick={() => onEditJournal(journal)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                {journal.title && (
                  <p className="text-sm text-gray-500">
                    {formatDate(journal.entry_date)}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {getPreview(journal.content)}
                </p>
                
                {journal.todos && journal.todos.length > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      <span>
                        {completedTodos(journal.todos)} of {journal.todos.length} tasks completed
                      </span>
                    </div>
                    
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {journal.todos.length} {journal.todos.length === 1 ? 'task' : 'tasks'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalList;
