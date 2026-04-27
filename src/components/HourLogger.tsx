import React, { useEffect, useState, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Clock, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HourLog {
  id?: string;
  hour_slot: number;
  activity: string;
  category: string | null;
  productivity_rating: number | null;
  notes: string | null;
}

const CATEGORIES = ['Work', 'Study', 'Exercise', 'Rest', 'Social', 'Hobby', 'Chores', 'Entertainment', 'Sleep', 'Other'];

const HourLogger: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<Record<number, HourLog>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const dateStr = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const loadLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('hour_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', dateStr);

    if (error) {
      toast({ title: 'Error loading logs', description: error.message, variant: 'destructive' });
    } else {
      const map: Record<number, HourLog> = {};
      data?.forEach((l: any) => { map[l.hour_slot] = l; });
      setLogs(map);
    }
    setLoading(false);
  }, [userId, dateStr, toast]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const updateLocal = (hour: number, patch: Partial<HourLog>) => {
    setLogs(prev => ({
      ...prev,
      [hour]: {
        hour_slot: hour,
        activity: '',
        category: null,
        productivity_rating: null,
        notes: null,
        ...prev[hour],
        ...patch,
      },
    }));
  };

  const saveHour = async (hour: number) => {
    if (!userId) return;
    const log = logs[hour];
    if (!log?.activity?.trim()) {
      toast({ title: 'Activity required', description: 'Please describe what you did this hour.', variant: 'destructive' });
      return;
    }
    setSaving(hour);
    const payload = {
      user_id: userId,
      log_date: dateStr,
      hour_slot: hour,
      activity: log.activity.trim(),
      category: log.category,
      productivity_rating: log.productivity_rating,
      notes: log.notes,
    };
    const { data, error } = await supabase
      .from('hour_logs')
      .upsert(payload, { onConflict: 'user_id,log_date,hour_slot' })
      .select()
      .single();
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      setLogs(prev => ({ ...prev, [hour]: data as any }));
      toast({ title: 'Saved', description: `${formatHour(hour)} logged.` });
    }
    setSaving(null);
  };

  const deleteHour = async (hour: number) => {
    const log = logs[hour];
    if (!log?.id) {
      setLogs(prev => { const { [hour]: _, ...rest } = prev; return rest; });
      return;
    }
    const { error } = await supabase.from('hour_logs').delete().eq('id', log.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setLogs(prev => { const { [hour]: _, ...rest } = prev; return rest; });
      toast({ title: 'Deleted' });
    }
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    setInsights('');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-hour-logs', {
        body: { days: 7 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data?.insights || 'No insights returned.');
    } catch (e: any) {
      toast({ title: 'AI Insights failed', description: e.message, variant: 'destructive' });
    } finally {
      setInsightsLoading(false);
    }
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${period}`;
  };

  const filledCount = Object.values(logs).filter(l => l.activity?.trim()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Hour Logger</h2>
              <p className="text-indigo-100 text-sm">Track your activities hour by hour</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDate(subDays(date, 1))} className="text-white hover:bg-white/20">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 bg-white/20 rounded-lg font-semibold min-w-[180px] text-center">
              {format(date, 'EEE, MMM d, yyyy')}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDate(addDays(date, 1))} className="text-white hover:bg-white/20">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-indigo-100">
            <span className="font-semibold text-white">{filledCount}/24</span> hours logged
          </div>
          <Button
            onClick={generateInsights}
            disabled={insightsLoading}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
            size="sm"
          >
            {insightsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            AI Insights (7 days)
          </Button>
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h3 className="font-semibold text-violet-900">AI Productivity Insights</h3>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
            {insights}
          </div>
        </Card>
      )}

      {/* Hour Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 24 }).map((_, hour) => {
            const log = logs[hour] || { hour_slot: hour, activity: '', category: null, productivity_rating: null, notes: null };
            const isFilled = !!log.activity?.trim();
            return (
              <Card key={hour} className={`p-4 transition-all ${isFilled ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700 min-w-[70px]">{formatHour(hour)}</span>
                    {isFilled && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveHour(hour)} disabled={saving === hour}>
                      {saving === hour ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-emerald-600" />}
                    </Button>
                    {isFilled && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteHour(hour)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  placeholder="What did you do this hour?"
                  value={log.activity || ''}
                  onChange={(e) => updateLocal(hour, { activity: e.target.value })}
                  className="mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={log.category || ''}
                    onValueChange={(v) => updateLocal(hour, { category: v })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select
                    value={log.productivity_rating?.toString() || ''}
                    onValueChange={(v) => updateLocal(hour, { productivity_rating: parseInt(v) })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Productivity" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{'⭐'.repeat(n)} ({n}/5)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HourLogger;
