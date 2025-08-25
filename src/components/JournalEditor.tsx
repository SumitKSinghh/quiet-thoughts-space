
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JournalAttachments } from './JournalAttachments';
import { uploadAttachments, loadAttachments, type Attachment } from './JournalAttachmentHelpers';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
}

interface JournalEditorProps {
  journal?: any;
  selectedDate: Date;
  onBack: () => void;
  onSave: () => void;
}

const JournalEditor = ({ journal, selectedDate, onBack, onSave }: JournalEditorProps) => {
  console.log('=== JOURNAL EDITOR COMPONENT RENDERING ===');
  console.log('Props received:', { journal, selectedDate, onBack: !!onBack, onSave: !!onSave });
  console.log('Journal prop type:', typeof journal);
  console.log('Selected date type:', typeof selectedDate);
  console.log('Selected date value:', selectedDate);
  
  if (!selectedDate) {
    console.error('CRITICAL ERROR: selectedDate is undefined/null');
    return <div>Error: No date selected</div>;
  }
  
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(selectedDate);
  const [journalType, setJournalType] = useState<'gratitude' | 'fitness' | 'dreams' | 'daily'>('daily');
  const [mood, setMood] = useState<'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' | ''>('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('JournalEditor useEffect triggered', { journal, selectedDate });
    try {
      if (journal) {
        console.log('Editing existing journal:', journal);
        setContent(journal.content || '');
        setTitle(journal.title || '');
        const journalDate = new Date(journal.entry_date);
        setDate(isNaN(journalDate.getTime()) ? selectedDate : journalDate);
        setJournalType(journal.journal_type || 'daily');
        setMood(journal.mood || '');
        // Load todos for this journal
        loadTodos(journal.id);
      } else {
        console.log('Creating new journal with date:', selectedDate);
        setContent('');
        setTitle('');
        setDate(selectedDate);
        setJournalType('daily');
        setMood('');
        setTodos([]);
      }
    } catch (error) {
      console.error('Error in JournalEditor useEffect:', error);
    }
  }, [journal, selectedDate]);

  const loadTodos = async (journalId: string) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('journal_id', journalId)
        .order('created_at');

      if (error) {
        console.error('Error loading todos (non-critical):', error);
        // Don't throw error, just log it and continue
        setTodos([]);
        return;
      }
      setTodos(data || []);
    } catch (error: any) {
      console.error('Error loading todos (non-critical):', error);
      // Don't throw error, just set empty todos
      setTodos([]);
    }
  };

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      const newTodoItem: Todo = {
        id: `temp-${Date.now()}`, // Temporary ID
        task: newTodo.trim(),
        completed: false,
      };
      setTodos([...todos, newTodoItem]);
      setNewTodo('');
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something in your journal entry.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let journalId = journal?.id;

      // Save or update journal entry
      if (journal) {
        const { error } = await supabase
          .from('journals')
          .update({
            title: title.trim() || null,
            content: content.trim(),
            entry_date: format(date, 'yyyy-MM-dd'),
            journal_type: journalType,
            mood: mood || null,
          })
          .eq('id', journal.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('journals')
          .insert([{
            user_id: user.id,
            title: title.trim() || null,
            content: content.trim(),
            entry_date: format(date, 'yyyy-MM-dd'),
            journal_type: journalType,
            mood: mood || null,
          }])
          .select()
          .single();

        if (error) throw error;
        journalId = data.id;
      }

      // Handle todos
      if (journalId) {
        // Delete existing todos if updating
        if (journal) {
          await supabase
            .from('todos')
            .delete()
            .eq('journal_id', journalId);
        }

        // Insert new todos
        if (todos.length > 0) {
          const todosToInsert = todos.map(todo => ({
            user_id: user.id,
            journal_id: journalId,
            task: todo.task,
            completed: todo.completed,
            entry_date: format(date, 'yyyy-MM-dd'),
          }));

          const { error } = await supabase
            .from('todos')
            .insert(todosToInsert);

          if (error) throw error;
        }
      }

      toast({
        title: "Journal saved",
        description: "Your entry has been saved successfully.",
      });

      onSave();
    } catch (error: any) {
      console.error('Error saving journal:', error);
      toast({
        title: "Error saving journal",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Entries
        </Button>
        
        <h2 className="text-2xl font-bold text-gray-900">
          {journal ? 'Edit Entry' : 'New Journal Entry'}
        </h2>
        
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entry Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setDate(newDate);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Journal Type and Mood */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Journal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="journal-type">Journal Type</Label>
                  <Select value={journalType} onValueChange={(value) => setJournalType(value as 'gratitude' | 'fitness' | 'dreams' | 'daily')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select journal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">📝 Daily Journal</SelectItem>
                      <SelectItem value="gratitude">🙏 Gratitude</SelectItem>
                      <SelectItem value="fitness">💪 Fitness</SelectItem>
                      <SelectItem value="dreams">💭 Dreams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mood">Mood (Optional)</Label>
                  <Select value={mood} onValueChange={(value) => setMood(value as 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' | '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No mood selected</SelectItem>
                      <SelectItem value="excellent">😄 Excellent</SelectItem>
                      <SelectItem value="good">😊 Good</SelectItem>
                      <SelectItem value="neutral">😐 Neutral</SelectItem>
                      <SelectItem value="bad">😞 Bad</SelectItem>
                      <SelectItem value="terrible">😢 Terrible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Title (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Give your entry a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-gray-200 focus:border-blue-500"
              />
            </CardContent>
          </Card>

          {/* Journal Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's on your mind?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write about your day, thoughts, experiences, or anything you'd like to remember..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] resize-none border-gray-200 focus:border-blue-500"
              />
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <JournalAttachments
                journalId={journal?.id}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                isEditing={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* To-Do List Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Todo */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a new task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddTodo}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Todo List */}
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center space-x-3 group">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        todo.completed 
                          ? "line-through text-gray-500" 
                          : "text-gray-900"
                      )}
                    >
                      {todo.task}
                    </span>
                    <Button
                      onClick={() => handleDeleteTodo(todo.id)}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {todos.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No tasks added yet. Create your first task above!
                  </p>
                )}
              </div>

              {/* Todo Stats */}
              {todos.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {todos.filter(t => t.completed).length} of {todos.length} completed
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(todos.filter(t => t.completed).length / todos.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JournalEditor;
