import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, isSameMonth } from 'date-fns';
import { Lock, Trophy, Target, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface MonthData {
  month: Date;
  journalCount: number;
  goalProgress: number;
  isCurrentMonth: boolean;
  isUnlocked: boolean;
}

interface GamifiedGoalsCalendarProps {
  userId: string;
  onMonthClick?: (month: Date) => void;
}

const GamifiedGoalsCalendar: React.FC<GamifiedGoalsCalendarProps> = ({ userId, onMonthClick }) => {
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [selectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    loadYearData();
  }, [selectedYear, userId]);

  const loadYearData = async () => {
    try {
      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

      const { data: journals, error } = await supabase
        .from('journals')
        .select('entry_date')
        .eq('user_id', userId)
        .gte('entry_date', format(yearStart, 'yyyy-MM-dd'))
        .lte('entry_date', format(yearEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const currentMonth = new Date();
      let total = 0;

      const data = months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const entriesInMonth = journals?.filter(j => {
          const entryDate = new Date(j.entry_date);
          return entryDate >= monthStart && entryDate <= monthEnd;
        }).length || 0;

        total += entriesInMonth;
        const isCurrentOrPast = month <= currentMonth;
        
        return {
          month,
          journalCount: entriesInMonth,
          goalProgress: Math.min((entriesInMonth / 15) * 100, 100),
          isCurrentMonth: isSameMonth(month, currentMonth),
          isUnlocked: isCurrentOrPast,
        };
      });

      setMonthsData(data);
      setTotalEntries(total);
      setCurrentStreak(Math.min(total, 30));
    } catch (error) {
      console.error('Error loading year data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthColor = (data: MonthData) => {
    if (!data.isUnlocked) return 'from-slate-200 to-slate-300';
    if (data.goalProgress >= 100) return 'from-emerald-400 to-teal-500';
    if (data.goalProgress >= 50) return 'from-blue-400 to-indigo-500';
    if (data.goalProgress > 0) return 'from-violet-400 to-purple-500';
    return 'from-slate-300 to-slate-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">Loading your journey...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Total Entries</span>
          </div>
          <div className="text-3xl font-bold">{totalEntries}</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Current Streak</span>
          </div>
          <div className="text-3xl font-bold">{currentStreak} days</div>
        </div>
        
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Year Progress</span>
          </div>
          <div className="text-3xl font-bold">{Math.round((totalEntries / 180) * 100)}%</div>
        </div>
      </div>

      {/* Gamified Calendar Grid */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-6 shadow-inner">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            {selectedYear} Journey
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              Complete
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" />
              On Track
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {monthsData.map((data, index) => (
            <div
              key={index}
              onClick={() => data.isUnlocked && onMonthClick?.(data.month)}
              className={cn(
                "relative group cursor-pointer transition-all duration-300 hover:scale-105",
                data.isCurrentMonth && "ring-2 ring-emerald-400 ring-offset-2"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl p-3 h-32 flex flex-col justify-between relative overflow-hidden shadow-lg",
                  "bg-gradient-to-b",
                  getMonthColor(data),
                  !data.isUnlocked && "opacity-70"
                )}
              >
                {!data.isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                )}

                {data.goalProgress >= 100 && (
                  <div className="absolute top-2 right-2">
                    <Trophy className="h-4 w-4 text-yellow-300 drop-shadow" />
                  </div>
                )}

                <div className="text-center">
                  <div className="text-white font-bold text-sm drop-shadow">
                    {format(data.month, 'MMM')}
                  </div>
                  <div className="text-white/80 text-xs">
                    {format(data.month, 'yyyy')}
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-white/20 backdrop-blur-sm rounded-b-2xl">
                  <div
                    className="h-1 bg-white/60 rounded-full mx-2 mb-2 transition-all duration-500"
                    style={{ width: `${Math.max(data.goalProgress, 5)}%` }}
                  />
                </div>

                <div className="text-center">
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                    <span className="text-white font-bold text-lg drop-shadow">
                      {data.journalCount}
                    </span>
                  </div>
                </div>

                {data.isCurrentMonth && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <ChevronRight className="h-4 w-4 text-emerald-500 rotate-90" />
                  </div>
                )}
              </div>

              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                  {data.journalCount} entries • {Math.round(data.goalProgress)}% complete
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamifiedGoalsCalendar;
