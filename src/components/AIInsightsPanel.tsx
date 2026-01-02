import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  RefreshCw, 
  Sparkles,
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  metadata: Record<string, any> | null;
  analyzed_entries_count: number | null;
  updated_at: string;
}

const AIInsightsPanel = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mood_pattern: true,
    goal_progress: true,
    suggestion: true,
    overall: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights((data || []) as unknown as Insight[]);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setIsGenerating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate insights.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-user-insights', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Insights generated!",
        description: "Your personalized insights have been updated.",
      });

      await fetchInsights();
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Failed to generate insights",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSection = (type: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'mood_pattern':
        return <Heart className="h-5 w-5 text-rose-500" />;
      case 'goal_progress':
        return <Target className="h-5 w-5 text-emerald-500" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case 'overall':
        return <Sparkles className="h-5 w-5 text-violet-500" />;
      default:
        return <Brain className="h-5 w-5 text-primary" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'mood_pattern':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'goal_progress':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'suggestion':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'overall':
        return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const renderInsightContent = (insight: Insight) => {
    const isExpanded = expandedSections[insight.insight_type];

    return (
      <Card key={insight.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardHeader 
          className="cursor-pointer pb-3"
          onClick={() => toggleSection(insight.insight_type)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getInsightIcon(insight.insight_type)}
              <div>
                <CardTitle className="text-lg">{insight.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={getInsightBadgeColor(insight.insight_type)}>
                    {insight.insight_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Based on {insight.analyzed_entries_count} entries
                  </span>
                </CardDescription>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <p className="text-muted-foreground leading-relaxed mb-4">
              {insight.content}
            </p>

            {/* Render metadata based on type */}
            {insight.insight_type === 'mood_pattern' && insight.metadata?.trends?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Key Trends
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insight.metadata.trends.map((trend: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {trend}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {insight.insight_type === 'goal_progress' && insight.metadata?.observations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Observations</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {insight.metadata.observations.map((obs: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insight.insight_type === 'suggestion' && insight.metadata?.items?.length > 0 && (
              <div className="space-y-3">
                {insight.metadata.items.map((item: { suggestion: string; reason: string }, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{item.suggestion}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">AI Wellness Insights</h2>
        </div>
        <Button 
          onClick={generateInsights} 
          disabled={isGenerating}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {insights.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No insights yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Write some journal entries and we'll analyze your patterns, moods, and progress to provide personalized insights.
            </p>
            <Button onClick={generateInsights} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate My First Insights'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Order: overall first, then mood, goals, suggestions */}
          {insights.find(i => i.insight_type === 'overall') && 
            renderInsightContent(insights.find(i => i.insight_type === 'overall')!)}
          {insights.find(i => i.insight_type === 'mood_pattern') && 
            renderInsightContent(insights.find(i => i.insight_type === 'mood_pattern')!)}
          {insights.find(i => i.insight_type === 'goal_progress') && 
            renderInsightContent(insights.find(i => i.insight_type === 'goal_progress')!)}
          {insights.find(i => i.insight_type === 'suggestion') && 
            renderInsightContent(insights.find(i => i.insight_type === 'suggestion')!)}
        </div>
      )}

      {insights.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(insights[0]?.updated_at).toLocaleDateString()} at{' '}
          {new Date(insights[0]?.updated_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default AIInsightsPanel;
