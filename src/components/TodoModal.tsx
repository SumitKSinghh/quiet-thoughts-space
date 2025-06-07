
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedDate?: Date;
}

const TodoModal = ({ isOpen, onClose, onSave, selectedDate }: TodoModalProps) => {
  const [task, setTask] = useState('');
  const [entryDate, setEntryDate] = useState<Date>(selectedDate || new Date());
  const [important, setImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!task.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task description.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create todos.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('todos')
        .insert({
          task: task.trim(),
          entry_date: format(entryDate, 'yyyy-MM-dd'),
          user_id: user.id,
          completed: false,
          important: important
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Todo created successfully!",
      });

      setTask('');
      setEntryDate(selectedDate || new Date());
      setImportant(false);
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error creating todo:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create todo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Todo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Task</label>
            <Textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Enter your task..."
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !entryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {entryDate ? format(entryDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={entryDate}
                  onSelect={(date) => date && setEntryDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setImportant(!important)}
              className={cn(
                "flex items-center space-x-2 p-2",
                important ? "text-yellow-600" : "text-gray-400"
              )}
            >
              <Star className={cn("h-4 w-4", important ? "fill-yellow-500" : "")} />
              <span className="text-sm">Mark as Important</span>
            </Button>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Todo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TodoModal;
