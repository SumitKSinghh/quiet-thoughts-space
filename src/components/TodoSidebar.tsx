
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ListTodo, 
  Calendar, 
  Star, 
  Users, 
  CheckSquare, 
  Flag,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isFuture } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import TodoModal from './TodoModal';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
  entry_date: string;
  user_id: string;
  journal_id: string | null;
}

interface TodoCategory {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  count: number;
}

const TodoSidebar = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('my-day');
  const [showTodos, setShowTodos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: todosData, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(todosData || []);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodoComplete = async (todoId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', todoId);

      if (error) throw error;

      setTodos(todos.map(todo => 
        todo.id === todoId ? { ...todo, completed: !completed } : todo
      ));

      toast({
        title: "Success",
        description: `Todo ${!completed ? 'completed' : 'uncompleted'}!`,
      });
    } catch (error: any) {
      console.error('Error updating todo:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update todo.",
        variant: "destructive",
      });
    }
  };

  const deleteTodo = async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (error) throw error;

      setTodos(todos.filter(todo => todo.id !== todoId));

      toast({
        title: "Success",
        description: "Todo deleted successfully!",
      });
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete todo.",
        variant: "destructive",
      });
    }
  };

  const getMyDayTodos = () => {
    return todos.filter(todo => isToday(new Date(todo.entry_date)) && !todo.completed);
  };

  const getImportantTodos = () => {
    return todos.filter(todo => !todo.completed);
  };

  const getPlannedTodos = () => {
    return todos.filter(todo => isFuture(new Date(todo.entry_date)));
  };

  const getAssignedTodos = () => {
    return todos.filter(todo => todo.journal_id !== null);
  };

  const getAllTasks = () => {
    return todos;
  };

  const getFlaggedTodos = () => {
    return todos.filter(todo => todo.completed);
  };

  const categories: TodoCategory[] = [
    {
      id: 'my-day',
      title: 'My Day',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      count: getMyDayTodos().length,
    },
    {
      id: 'important',
      title: 'Important',
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      count: getImportantTodos().length,
    },
    {
      id: 'planned',
      title: 'Planned',
      icon: Calendar,
      color: 'from-green-500 to-teal-500',
      count: getPlannedTodos().length,
    },
    {
      id: 'assigned',
      title: 'Assigned to Me',
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      count: getAssignedTodos().length,
    },
    {
      id: 'tasks',
      title: 'Tasks',
      icon: CheckSquare,
      color: 'from-gray-500 to-slate-500',
      count: getAllTasks().length,
    },
    {
      id: 'flagged',
      title: 'Flagged Email',
      icon: Flag,
      color: 'from-red-500 to-pink-500',
      count: getFlaggedTodos().length,
    },
  ];

  const getCurrentTodos = () => {
    switch (selectedCategory) {
      case 'my-day':
        return getMyDayTodos();
      case 'important':
        return getImportantTodos();
      case 'planned':
        return getPlannedTodos();
      case 'assigned':
        return getAssignedTodos();
      case 'tasks':
        return getAllTasks();
      case 'flagged':
        return getFlaggedTodos();
      default:
        return todos;
    }
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Todo Categories */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50">
        <CardHeader 
          className="pb-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg cursor-pointer"
          onClick={() => setShowTodos(!showTodos)}
        >
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center">
              <ListTodo className="h-5 w-5 mr-2 text-white drop-shadow" />
              To-Do Lists
            </span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform text-white",
                showTodos ? "rotate-180" : ""
              )}
            />
          </CardTitle>
        </CardHeader>
        
        {showTodos && (
          <CardContent className="space-y-2 p-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-left bg-gradient-to-r",
                    category.color,
                    "text-white hover:scale-105 transform transition-all duration-200 shadow-md hover:shadow-lg",
                    selectedCategory === category.id && "ring-2 ring-white/50"
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="flex items-center">
                    <IconComponent className="h-4 w-4 mr-2" />
                    {category.title}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white border-white/30"
                  >
                    {category.count}
                  </Badge>
                </Button>
              );
            })}
          </CardContent>
        )}
      </Card>

      {/* Selected Category Todos */}
      {showTodos && selectedCategoryData && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader className={cn(
            "pb-4 text-white rounded-t-lg bg-gradient-to-r",
            selectedCategoryData.color
          )}>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <selectedCategoryData.icon className="h-5 w-5 mr-2 text-white drop-shadow" />
                {selectedCategoryData.title}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                Loading todos...
              </div>
            ) : getCurrentTodos().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No tasks in this category</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first task
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {getCurrentTodos().slice(0, 5).map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border transition-colors group",
                      todo.completed 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <button
                        onClick={() => toggleTodoComplete(todo.id, todo.completed)}
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                          todo.completed 
                            ? "bg-green-500 border-green-500" 
                            : "border-gray-300 hover:border-green-400"
                        )}
                      >
                        {todo.completed && (
                          <CheckSquare className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <span className={cn(
                        "text-sm flex-1",
                        todo.completed && "line-through"
                      )}>
                        {todo.task}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {format(new Date(todo.entry_date), 'MMM d')}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                        onClick={() => deleteTodo(todo.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {getCurrentTodos().length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      View {getCurrentTodos().length - 5} more...
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <TodoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadTodos}
      />
    </div>
  );
};

export default TodoSidebar;
