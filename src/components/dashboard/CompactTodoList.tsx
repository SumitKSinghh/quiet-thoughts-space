import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import TodoModal from '@/components/TodoModal';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
  entry_date: string;
  important: boolean;
}

const CompactTodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('important', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (id: string) => {
    try {
      await supabase
        .from('todos')
        .update({ completed: true })
        .eq('id', id);

      setTodos(todos.filter(t => t.id !== id));
      toast({ title: "Task completed! 🎉" });
    } catch (error) {
      console.error('Error completing todo:', error);
    }
  };

  const toggleImportant = async (id: string, current: boolean) => {
    try {
      await supabase
        .from('todos')
        .update({ important: !current })
        .eq('id', id);

      setTodos(todos.map(t => t.id === id ? { ...t, important: !current } : t));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await supabase.from('todos').delete().eq('id', id);
      setTodos(todos.filter(t => t.id !== id));
      toast({ title: "Task deleted" });
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-100">
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Today's Tasks</h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-white hover:bg-white/20"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All clear! Add a task</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "group flex items-center gap-2 p-2 rounded-lg transition-all",
                "hover:bg-slate-50 border border-transparent hover:border-slate-100",
                isToday(new Date(todo.entry_date)) && "bg-violet-50/50"
              )}
            >
              <button
                onClick={() => toggleComplete(todo.id)}
                className="flex-shrink-0 text-slate-300 hover:text-emerald-500 transition-colors"
              >
                <Circle className="h-5 w-5" />
              </button>
              
              <span className="flex-1 text-sm text-slate-700 truncate">
                {todo.task}
              </span>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleImportant(todo.id, todo.important)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    todo.important ? "text-amber-500" : "text-slate-300 hover:text-amber-500"
                  )}
                >
                  <Star className={cn("h-4 w-4", todo.important && "fill-current")} />
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {todo.important && (
                <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0 group-hover:hidden" />
              )}
            </div>
          ))
        )}
      </div>

      <TodoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadTodos}
      />
    </div>
  );
};

export default CompactTodoList;
