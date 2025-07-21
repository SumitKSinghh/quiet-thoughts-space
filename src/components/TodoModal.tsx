
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkGoogleCalendarConnection();
  }, []);

  const checkGoogleCalendarConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('google_calendar_tokens')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasGoogleCalendar(!!data);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
    }
  };

  const createGoogleCalendarEvent = async (todoId: string) => {
    if (!hasGoogleCalendar || !syncToCalendar) return null;

    try {
      const { data: tokens } = await supabase
        .from('google_calendar_tokens')
        .select('access_token, expires_at, refresh_token')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!tokens) return null;

      // Check if token needs refresh
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      let accessToken = tokens.access_token;

      if (expiresAt <= now) {
        // Refresh the token
        const { data: refreshedTokens, error: refreshError } = await supabase.functions.invoke('google-calendar', {
          body: {
            action: 'refresh_token',
            refreshToken: tokens.refresh_token
          }
        });

        if (refreshError) throw refreshError;

        accessToken = refreshedTokens.access_token;
        
        // Update the tokens in database
        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: refreshedTokens.access_token,
            expires_at: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString()
          })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      }

      // Create the calendar event
      const eventData = {
        summary: task.trim(),
        description: `Task from your journal app${important ? ' (Important)' : ''}`,
        start: {
          date: format(entryDate, 'yyyy-MM-dd')
        },
        end: {
          date: format(entryDate, 'yyyy-MM-dd')
        },
        reminders: {
          useDefault: true
        }
      };

      const { data: event, error: eventError } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'create_event',
          accessToken,
          eventData
        }
      });

      if (eventError) throw eventError;

      // Update the todo with the Google Calendar event ID
      await supabase
        .from('todos')
        .update({ google_calendar_event_id: event.id })
        .eq('id', todoId);

      return event.id;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      // Don't fail the todo creation if calendar sync fails
      toast({
        title: "Warning",
        description: "Todo created but couldn't sync to Google Calendar.",
        variant: "destructive",
      });
      return null;
    }
  };

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

      const { data: todoData, error } = await supabase
        .from('todos')
        .insert({
          task: task.trim(),
          entry_date: format(entryDate, 'yyyy-MM-dd'),
          user_id: user.id,
          completed: false,
          important: important
        })
        .select()
        .single();

      if (error) throw error;

      // Create Google Calendar event if enabled
      if (hasGoogleCalendar && syncToCalendar) {
        await createGoogleCalendarEvent(todoData.id);
      }

      toast({
        title: "Success",
        description: hasGoogleCalendar && syncToCalendar 
          ? "Todo created and synced to Google Calendar!"
          : "Todo created successfully!",
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
                    "w-full justify-start text-left font-normal mt-1 bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 border-slate-200 shadow-sm",
                    !entryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-600" />
                  {entryDate ? format(entryDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-lg border-slate-200" align="start">
                <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 rounded-lg border border-slate-200">
                  <Calendar
                    mode="single"
                    selected={entryDate}
                    onSelect={(date) => date && setEntryDate(date)}
                    initialFocus
                    className="p-4 pointer-events-auto"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center mb-4",
                      caption_label: "text-sm font-semibold text-slate-700",
                      nav: "space-x-1 flex items-center",
                      nav_button: cn(
                        "h-7 w-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-md opacity-80 hover:opacity-100 transition-all shadow-sm"
                      ),
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-slate-600 rounded-md w-9 font-medium text-[0.8rem] text-center",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-100 [&:has([aria-selected].day-outside)]:bg-slate-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: cn(
                        "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-colors"
                      ),
                      day_selected: "bg-gradient-to-r from-slate-600 to-gray-600 text-white hover:from-slate-700 hover:to-gray-700 focus:from-slate-600 focus:to-gray-600 shadow-sm",
                      day_today: "bg-slate-100 text-slate-900 font-semibold border border-slate-300",
                      day_outside: "text-slate-400 opacity-50 aria-selected:bg-slate-100 aria-selected:text-slate-600 aria-selected:opacity-30",
                      day_disabled: "text-slate-300 opacity-50",
                      day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
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
                "flex items-center space-x-2 p-2 rounded-lg transition-colors",
                important ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <Star className={cn("h-4 w-4", important ? "fill-amber-500 text-amber-500" : "")} />
              <span className="text-sm">Mark as Important</span>
            </Button>
          </div>

          {hasGoogleCalendar && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync-calendar"
                checked={syncToCalendar}
                onCheckedChange={(checked) => setSyncToCalendar(checked === true)}
              />
              <label
                htmlFor="sync-calendar"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Sync to Google Calendar
              </label>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="border-slate-200 hover:bg-slate-50">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 shadow-sm"
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
