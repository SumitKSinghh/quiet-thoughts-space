import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Target, TrendingUp, Calendar, Users, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DreamAnalysis {
  summary: string;
  category: string;
  feasibility: string;
  uniqueness: string;
  timeframe: string;
  keySteps: string[];
  challenges: string[];
  resources: string[];
  actionPlan?: {
    milestones: Array<{
      title: string;
      timeframe: string;
      actions: string[];
      metrics: string;
    }>;
    dailyHabits: string[];
    weeklyGoals: string[];
    monthlyReview: string[];
    networking: string[];
    skills: string[];
  };
  inspiringExamples?: Array<{
    title: string;
    description: string;
    url: string;
  }>;
}

export const DreamAnalyzer = () => {
  const [dreamText, setDreamText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeDream = async () => {
    if (!dreamText.trim()) {
      toast({
        title: "Dream required",
        description: "Please enter your dream or goal first",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      // Save dream to database first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: dream, error: insertError } = await supabase
        .from('dreams')
        .insert({
          user_id: user.id,
          dream_text: dreamText,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Analyze the dream
      const { data, error } = await supabase.functions.invoke('analyze-dream', {
        body: { dreamText, dreamId: dream.id },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Analysis failed');

      setAnalysis(data.analysis);
      toast({
        title: "Analysis complete!",
        description: "Your dream has been analyzed with actionable insights.",
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Dream Analyzer
          </CardTitle>
          <CardDescription>
            Share your dream or goal, and get AI-powered insights on how to achieve it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe your dream or goal in detail... (e.g., 'I want to become a successful entrepreneur and build a tech startup that helps people learn coding')"
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            className="min-h-[120px]"
            disabled={analyzing}
          />
          <Button 
            onClick={analyzeDream} 
            disabled={analyzing || !dreamText.trim()}
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing your dream...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze My Dream
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground">{analysis.summary}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{analysis.category}</Badge>
                <Badge className={getFeasibilityColor(analysis.feasibility)}>
                  {analysis.feasibility} feasibility
                </Badge>
                <Badge variant="outline">{analysis.uniqueness}</Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Estimated timeframe: {analysis.timeframe}</span>
              </div>
            </CardContent>
          </Card>

          {/* Key Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Key Steps to Achieve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {analysis.keySteps.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="font-semibold text-primary">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Action Plan */}
          {analysis.actionPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Action Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Milestones */}
                {analysis.actionPlan.milestones && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Milestones
                    </h3>
                    <div className="space-y-4">
                      {analysis.actionPlan.milestones.map((milestone, index) => (
                        <div key={index} className="border-l-2 border-primary pl-4 space-y-2">
                          <div>
                            <p className="font-semibold">{milestone.title}</p>
                            <p className="text-sm text-muted-foreground">{milestone.timeframe}</p>
                          </div>
                          <ul className="text-sm space-y-1">
                            {milestone.actions.map((action, i) => (
                              <li key={i} className="flex gap-2">
                                <span>•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-muted-foreground">
                            <strong>Metrics:</strong> {milestone.metrics}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Daily Habits */}
                {analysis.actionPlan.dailyHabits && (
                  <div>
                    <h3 className="font-semibold mb-2">Daily Habits</h3>
                    <ul className="space-y-1">
                      {analysis.actionPlan.dailyHabits.map((habit, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span>✓</span>
                          <span>{habit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills to Develop */}
                {analysis.actionPlan.skills && (
                  <div>
                    <h3 className="font-semibold mb-2">Skills to Develop</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.actionPlan.skills.map((skill, i) => (
                        <Badge key={i} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Challenges & Resources */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.challenges.map((challenge, index) => (
                    <li key={index} className="flex gap-2">
                      <span>⚠️</span>
                      <span className="text-sm">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.resources.map((resource, index) => (
                    <li key={index} className="flex gap-2">
                      <span>📚</span>
                      <span className="text-sm">{resource}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Inspiring Examples */}
          {analysis.inspiringExamples && analysis.inspiringExamples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Success Stories
                </CardTitle>
                <CardDescription>
                  People who achieved similar dreams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.inspiringExamples.map((example, index) => (
                    <div key={index} className="border-l-2 border-muted pl-4">
                      <a 
                        href={example.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        {example.title}
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        {example.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};