
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronDown, TrendingUp, Target, Flame, BookOpen } from 'lucide-react';
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
    { label: 'Today', date: new Date(), color: 'from-orange-300 to-pink-300' },
    { label: 'Yesterday', date: new Date(Date.now() - 24 * 60 * 60 * 1000), color: 'from-violet-300 to-indigo-300' },
    { label: 'This Week', date: new Date(), color: 'from-blue-300 to-cyan-300' },
    { label: 'This Month', date: new Date(), color: 'from-emerald-300 to-teal-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Date Selection */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-violet-50">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-400 to-gray-500 text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-white drop-shadow" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4">
          {quickDateOptions.map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left bg-gradient-to-r",
                option.color,
                "text-white hover:scale-105 transform transition-all duration-200 shadow-md hover:shadow-lg"
              )}
              onClick={() => onDateSelect(option.date)}
            >
              {option.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-t-lg">
          <CardTitle 
            className="text-lg flex items-center justify-between cursor-pointer"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <span className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-white drop-shadow" />
              Calendar
            </span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform text-white",
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
                caption_label: "text-sm font-medium text-gray-700",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-gradient-to-r from-violet-300 to-indigo-300 text-white p-0 hover:from-violet-400 hover:to-indigo-400 border-0 rounded-full shadow-md"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex w-full mb-2",
                head_cell: "text-gray-600 rounded-md w-full font-semibold text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-1",
                cell: "text-center text-sm p-0 relative flex-1 h-9",
                day: cn(
                  "h-9 w-full p-0 font-normal hover:bg-gradient-to-r hover:from-blue-300 hover:to-violet-300 hover:text-white rounded-md transition-all duration-200"
                ),
                day_selected: "bg-gradient-to-r from-emerald-400 to-teal-400 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md",
                day_today: "bg-gradient-to-r from-orange-300 to-pink-300 text-white font-bold shadow-md",
                day_outside: "text-gray-400 opacity-50",
                day_disabled: "text-gray-300 opacity-50",
                day_hidden: "invisible",
              }}
            />
          </CardContent>
        )}
      </Card>

      {/* Journal Stats */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50">
        <CardHeader className="pb-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-white drop-shadow" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-violet-100 rounded-lg">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-600" />
              Entries this month
            </span>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">{stats.entriesThisMonth}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Flame className="h-4 w-4 mr-2 text-orange-600" />
              Current streak
            </span>
            <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{stats.currentStreak} days</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-emerald-600" />
              Total entries
            </span>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.totalEntries}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarSidebar;
