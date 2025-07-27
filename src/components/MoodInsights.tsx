import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Smile, BarChart3 } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface MoodData {
  entry_date: string;
  mood: string;
}

interface MoodSummary {
  mood: string;
  count: number;
  percentage: number;
}

interface MoodTrend {
  date: string;
  mood_score: number;
}

const MOOD_COLORS = {
  excellent: '#22c55e',
  good: '#84cc16',
  neutral: '#eab308',
  bad: '#f97316',
  terrible: '#ef4444'
};

const MOOD_SCORES = {
  terrible: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  excellent: 5
};

const MoodInsights: React.FC = () => {
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMoodData();
  }, [timeRange]);

  const fetchMoodData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: Date;
      const endDate = new Date();

      switch (timeRange) {
        case 'week':
          startDate = startOfWeek(endDate);
          break;
        case 'month':
          startDate = startOfMonth(endDate);
          break;
        case '3months':
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = startOfMonth(endDate);
      }

      const { data, error } = await supabase
        .from('journals')
        .select('entry_date, mood')
        .eq('user_id', user.id)
        .not('mood', 'is', null)
        .gte('entry_date', format(startDate, 'yyyy-MM-dd'))
        .lte('entry_date', format(endDate, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: true });

      if (error) throw error;
      setMoodData(data || []);
    } catch (error) {
      console.error('Error fetching mood data:', error);
      toast({
        title: "Error",
        description: "Could not load mood data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodSummary = (): MoodSummary[] => {
    const moodCounts = moodData.reduce((acc, entry) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: (count / total) * 100
    })).sort((a, b) => b.count - a.count);
  };

  const getMoodTrends = (): MoodTrend[] => {
    return moodData
      .filter(entry => entry.mood)
      .map(entry => ({
        date: format(parseISO(entry.entry_date), 'MMM dd'),
        mood_score: MOOD_SCORES[entry.mood as keyof typeof MOOD_SCORES] || 3
      }));
  };

  const getAverageMood = (): number => {
    if (moodData.length === 0) return 0;
    
    const scores = moodData
      .filter(entry => entry.mood)
      .map(entry => MOOD_SCORES[entry.mood as keyof typeof MOOD_SCORES] || 3);
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const getMoodEmoji = (mood: string): string => {
    const emojis = {
      excellent: '😄',
      good: '😊',
      neutral: '😐',
      bad: '😞',
      terrible: '😢'
    };
    return emojis[mood as keyof typeof emojis] || '😐';
  };

  const getAverageMoodLabel = (score: number): string => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Neutral';
    if (score >= 1.5) return 'Bad';
    return 'Terrible';
  };

  const moodSummary = getMoodSummary();
  const moodTrends = getMoodTrends();
  const averageMood = getAverageMood();

  if (isLoading) {
    return <div className="text-center py-8">Loading mood insights...</div>;
  }

  if (moodData.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Smile className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No mood data yet</h3>
          <p className="text-muted-foreground">
            Start journaling with mood tracking to see your insights here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Mood Graph & Insights
        </h2>
        
        <Select value={timeRange} onValueChange={(value: 'week' | 'month' | '3months') => setTimeRange(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageMood.toFixed(1)} / 5
            </div>
            <p className="text-sm text-muted-foreground">
              {getAverageMoodLabel(averageMood)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moodData.length}</div>
            <p className="text-sm text-muted-foreground">
              With mood tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Common Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {moodSummary[0]?.mood ? getMoodEmoji(moodSummary[0].mood) : '😐'}
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {moodSummary[0]?.mood || 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mood Trend Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={moodTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                domain={[1, 5]} 
                tickFormatter={(value) => {
                  const labels = ['', 'Terrible', 'Bad', 'Neutral', 'Good', 'Excellent'];
                  return labels[value] || '';
                }}
              />
              <Tooltip 
                formatter={(value: number) => [
                  getAverageMoodLabel(value),
                  'Mood'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="mood_score" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mood Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={moodSummary}
                  dataKey="count"
                  nameKey="mood"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ mood, percentage }) => 
                    `${mood} (${percentage.toFixed(1)}%)`
                  }
                >
                  {moodSummary.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={MOOD_COLORS[entry.mood as keyof typeof MOOD_COLORS] || '#8884d8'} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mood Frequency Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={moodSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mood" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mood Summary List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Mood Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {moodSummary.map((mood) => (
              <div key={mood.mood} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMoodEmoji(mood.mood)}</span>
                  <div>
                    <div className="font-medium capitalize">{mood.mood}</div>
                    <div className="text-sm text-muted-foreground">
                      {mood.count} entries
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{mood.percentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">of total</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoodInsights;