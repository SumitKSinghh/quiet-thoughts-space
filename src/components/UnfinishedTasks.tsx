import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckSquare, Star, AlertCircle, Plus } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
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
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="text-center text-orange-600">Loading unfinished tasks...</div>
        </CardContent>
      </Card>
    );
  }

  if (todos.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-orange-200 bg-orange-50 shadow-lg">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 bg-gradient-to-r from-orange-300 to-amber-300 text-slate-700 rounded-t-lg cursor-pointer hover:from-orange-400 hover:to-amber-400 transition-colors">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-slate-700 drop-shadow" />
                Unfinished Tasks
                <Badge 
                  variant="secondary" 
                  className="ml-2 bg-white/30 text-slate-700 border-white/40"
                >
                  {todos.length}
                </Badge>
              </div>
              <Plus 
                className={cn(
                  "h-5 w-5 text-slate-700 transition-transform duration-200",
                  isOpen && "rotate-45"
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 transition-colors group"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => toggleTodoComplete(todo.id)}
                      className="w-5 h-5 rounded border-2 border-orange-400 hover:border-orange-500 hover:bg-orange-100 flex items-center justify-center transition-colors"
                    >
                      <CheckSquare className="h-3 w-3 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <span className="text-orange-700 font-medium flex-1">
                      {todo.task}
                    </span>
                    {todo.important && (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-orange-500 font-medium">
                      {format(new Date(todo.entry_date), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default UnfinishedTasks;
