
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
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isFuture } from 'date-fns';

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

  const getMyDayTodos = () => {
    return todos.filter(todo => isToday(new Date(todo.entry_date)) && !todo.completed);
  };

  const getImportantTodos = () => {
    // For demo purposes, considering incomplete todos as important
    return todos.filter(todo => !todo.completed);
  };

  const getPlannedTodos = () => {
    return todos.filter(todo => isFuture(new Date(todo.entry_date)));
  };

  const getAssignedTodos = () => {
    // For demo purposes, showing todos with journal_id as "assigned"
    return todos.filter(todo => todo.journal_id !== null);
  };

  const getAllTasks = () => {
    return todos;
  };

  const getFlaggedTodos = () => {
    // For demo purposes, showing completed todos as "flagged"
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
              </div>
            ) : (
              <div className="space-y-2">
                {getCurrentTodos().slice(0, 5).map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border transition-colors",
                      todo.completed 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center",
                        todo.completed 
                          ? "bg-green-500 border-green-500" 
                          : "border-gray-300"
                      )}>
                        {todo.completed && (
                          <CheckSquare className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm",
                        todo.completed && "line-through"
                      )}>
                        {todo.task}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(todo.entry_date), 'MMM d')}
                    </span>
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
    </div>
  );
};

export default TodoSidebar;
