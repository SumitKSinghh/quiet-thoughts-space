import React, { useState, useEffect } from 'react';
import { BookOpen, Target, Flame, TrendingUp, Calendar, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  gradient: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtitle, gradient, delay = 0 }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl p-4 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl",
      "bg-gradient-to-br",
      gradient
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="relative z-10">
      <div className="flex items-center gap-2 text-white/80 mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && (
        <div className="text-xs text-white/70 mt-1">{subtitle}</div>
      )}
    </div>
    
    {/* Decorative circles */}
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
    <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full" />
  </div>
);

interface QuickStatsGridProps {
  userId: string;
}

const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ userId }) => {
  const [stats, setStats] = useState({
    entriesThisMonth: 0,
    currentStreak: 0,
    totalEntries: 0,
    goalsInProgress: 0,
    averageMood: 'N/A',
    todayEntry: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      // Parallel queries for better performance — no extra getUser() call
      const [monthlyRes, totalRes, recentRes, goalsRes, todayRes] = await Promise.all([
        supabase
          .from('journals')
          .select('id')
          .eq('user_id', userId)
          .gte('entry_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('entry_date', format(monthEnd, 'yyyy-MM-dd')),
        supabase
          .from('journals')
          .select('id')
          .eq('user_id', userId),
        supabase
          .from('journals')
          .select('entry_date, mood')
          .eq('user_id', userId)
          .order('entry_date', { ascending: false })
          .limit(30),
        supabase
          .from('goals')
          .select('id')
          .eq('user_id', userId)
          .eq('is_completed', false),
        supabase
          .from('journals')
          .select('id')
          .eq('user_id', userId)
          .eq('entry_date', format(today, 'yyyy-MM-dd'))
      ]);

      // Calculate streak
      let streak = 0;
      const uniqueDates = new Set(recentRes.data?.map(entry => entry.entry_date) || []);
      for (let i = 0; i < 30; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        if (uniqueDates.has(checkDate)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      // Calculate average mood
      const moodScores = { excellent: 5, good: 4, neutral: 3, bad: 2, terrible: 1 };
      const moodsWithScores = recentRes.data?.filter(e => e.mood) || [];
      let avgMood = 'N/A';
      if (moodsWithScores.length > 0) {
        const sum = moodsWithScores.reduce((acc, e) => acc + (moodScores[e.mood as keyof typeof moodScores] || 3), 0);
        const avg = sum / moodsWithScores.length;
        if (avg >= 4.5) avgMood = '😄';
        else if (avg >= 3.5) avgMood = '😊';
        else if (avg >= 2.5) avgMood = '😐';
        else avgMood = '😞';
      }

      setStats({
        entriesThisMonth: monthlyRes.data?.length || 0,
        currentStreak: streak,
        totalEntries: totalRes.data?.length || 0,
        goalsInProgress: goalsRes.data?.length || 0,
        averageMood: avgMood,
        todayEntry: (todayRes.data?.length || 0) > 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={<Calendar className="h-4 w-4" />}
        label="This Month"
        value={stats.entriesThisMonth}
        subtitle="entries"
        gradient="from-blue-500 to-cyan-500"
        delay={0}
      />
      <StatCard
        icon={<Flame className="h-4 w-4" />}
        label="Streak"
        value={`${stats.currentStreak}d`}
        subtitle="keep it up!"
        gradient="from-orange-500 to-red-500"
        delay={50}
      />
      <StatCard
        icon={<BookOpen className="h-4 w-4" />}
        label="All Time"
        value={stats.totalEntries}
        subtitle="total entries"
        gradient="from-emerald-500 to-teal-500"
        delay={100}
      />
      <StatCard
        icon={<Target className="h-4 w-4" />}
        label="Goals"
        value={stats.goalsInProgress}
        subtitle="in progress"
        gradient="from-violet-500 to-purple-500"
        delay={150}
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Mood"
        value={stats.averageMood}
        subtitle="this month"
        gradient="from-pink-500 to-rose-500"
        delay={200}
      />
      <StatCard
        icon={<Brain className="h-4 w-4" />}
        label="Today"
        value={stats.todayEntry ? '✓' : '—'}
        subtitle={stats.todayEntry ? 'logged' : 'pending'}
        gradient={stats.todayEntry ? "from-green-500 to-emerald-500" : "from-slate-400 to-slate-500"}
        delay={250}
      />
    </div>
  );
};

export default QuickStatsGrid;
