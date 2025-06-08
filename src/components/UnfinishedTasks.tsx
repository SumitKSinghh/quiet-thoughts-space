
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Star, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
  entry_date: string;
  user_id: string;
  journal_id: string | null;
  important: boolean;
}

const UnfinishedTasks = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUnfinishedTodos();
  }, []);

  const loadUnfinishedTodos = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: todosData, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(todosData || []);
    } catch (error) {
      console.error('Error loading unfinished todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodoComplete = async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: true })
        .eq('id', todoId);

      if (error) throw error;

      setTodos(todos.filter(todo => todo.id !== todoId));

      toast({
        title: "Success",
        description: "Task completed!",
      });
    } catch (error: any) {
      console.error('Error updating todo:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete task.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center text-red-600">Loading unfinished tasks...</div>
        </CardContent>
      </Card>
    );
  }

  if (todos.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50 shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
        <CardTitle className="text-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-white drop-shadow" />
          Unfinished Tasks
          <Badge 
            variant="secondary" 
            className="ml-2 bg-white/20 text-white border-white/30"
          >
            {todos.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center space-x-3 flex-1">
                <button
                  onClick={() => toggleTodoComplete(todo.id)}
                  className="w-5 h-5 rounded border-2 border-red-400 hover:border-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <CheckSquare className="h-3 w-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <span className="text-red-700 font-medium flex-1">
                  {todo.task}
                </span>
                {todo.important && (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-red-500 font-medium">
                  {format(new Date(todo.entry_date), 'MMM d')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnfinishedTasks;
