
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface Stats {
  entriesThisMonth: number;
  currentStreak: number;
  totalEntries: number;
}

const CalendarSidebar = ({ selectedDate, onDateSelect }: CalendarSidebarProps) => {
  const [showCalendar, setShowCalendar] = useState(true);
  const [stats, setStats] = useState<Stats>({
    entriesThisMonth: 0,
    currentStreak: 0,
    totalEntries: 0,
  });

  useEffect(() => {
    loadStats();
  }, [selectedDate]);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get entries this month
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      const { data: monthlyEntries, error: monthlyError } = await supabase
        .from('journals')
        .select('id')
        .eq('user_id', user.id)
        .gte('entry_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('entry_date', format(monthEnd, 'yyyy-MM-dd'));

      if (monthlyError) throw monthlyError;

      // Get total entries
      const { data: totalEntries, error: totalError } = await supabase
        .from('journals')
        .select('id')
        .eq('user_id', user.id);

      if (totalError) throw totalError;

      // Calculate current streak (simplified)
      const { data: recentEntries, error: recentError } = await supabase
        .from('journals')
        .select('entry_date')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(30);

      if (recentError) throw recentError;

      let streak = 0;
      const today = new Date();
      const uniqueDates = new Set(recentEntries?.map(entry => entry.entry_date) || []);
      
      for (let i = 0; i < 30; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        if (uniqueDates.has(checkDate)) {
          streak++;
        } else if (i > 0) { // Allow for today to not have an entry yet
          break;
        }
      }

      setStats({
        entriesThisMonth: monthlyEntries?.length || 0,
        currentStreak: streak,
        totalEntries: totalEntries?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const quickDateOptions = [
    { label: 'Today', date: new Date() },
    { label: 'Yesterday', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { label: 'This Week', date: new Date() },
    { label: 'This Month', date: new Date() },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Date Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickDateOptions.map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left",
                "hover:bg-blue-50 hover:text-blue-700"
              )}
              onClick={() => onDateSelect(option.date)}
            >
              {option.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle 
            className="text-lg flex items-center justify-between cursor-pointer"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <span className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
              Calendar
            </span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform",
                showCalendar ? "rotate-180" : ""
              )}
            />
          </CardTitle>
        </CardHeader>
        
        {showCalendar && (
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateSelect(date)}
              className="w-full border-0 p-0"
              classNames={{
                months: "flex w-full",
                month: "w-full",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input hover:bg-accent hover:text-accent-foreground"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex w-full mb-2",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-1",
                cell: "text-center text-sm p-0 relative flex-1 h-9 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                ),
                day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white",
                day_today: "bg-blue-100 text-blue-900 font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />
          </CardContent>
        )}
      </Card>

      {/* Journal Stats */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Entries this month</span>
            <span className="font-semibold text-blue-600">{stats.entriesThisMonth}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current streak</span>
            <span className="font-semibold text-green-600">{stats.currentStreak} days</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total entries</span>
            <span className="font-semibold text-gray-900">{stats.totalEntries}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarSidebar;
