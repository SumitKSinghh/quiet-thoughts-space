import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Target, TrendingUp, Calendar, Edit, Trash2, Sparkles, Loader2, Users, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Goal {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  target_date: string;
  is_completed: boolean;
  created_at: string;
  analysis?: DreamAnalysis;
}

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

const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [analyzingGoalId, setAnalyzingGoalId] = useState<string | null>(null);
  const [selectedGoalForAnalysis, setSelectedGoalForAnalysis] = useState<Goal | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unit, setUnit] = useState('');
  const [targetDate, setTargetDate] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals((data || []) as unknown as Goal[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load goals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetValue('');
    setCurrentValue('');
    setUnit('');
    setTargetDate('');
    setEditingGoal(null);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetValue(goal.target_value.toString());
    setCurrentValue(goal.current_value.toString());
    setUnit(goal.unit || '');
    setTargetDate(goal.target_date || '');
    setIsDialogOpen(true);
  };

  const saveGoal = async () => {
    if (!title.trim() || !targetValue) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const goalData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        target_value: parseFloat(targetValue),
        current_value: parseFloat(currentValue) || 0,
        unit: unit.trim() || 'count',
        target_date: targetDate || null,
        is_completed: false,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoal.id);

        if (error) throw error;
        
        toast({
          title: "Goal updated",
          description: "Your goal has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([goalData]);

        if (error) throw error;
        
        toast({
          title: "Goal created",
          description: "Your new goal has been created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchGoals();
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save your goal",
        variant: "destructive",
      });
    }
  };

  const analyzeGoal = async (goal: Goal) => {
    setAnalyzingGoalId(goal.id);
    try {
      const dreamText = `${goal.title}. ${goal.description || ''} Target: ${goal.target_value} ${goal.unit}${goal.target_date ? ` by ${format(new Date(goal.target_date), 'MMM yyyy')}` : ''}`;
      
      const { data, error } = await supabase.functions.invoke('analyze-dream', {
        body: { dreamText, dreamId: null },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Analysis failed');

      // Update goal with analysis
      const { error: updateError } = await supabase
        .from('goals')
        .update({ analysis: data.analysis })
        .eq('id', goal.id);

      if (updateError) throw updateError;

      toast({
        title: "Analysis complete!",
        description: "Your goal has been analyzed with actionable insights.",
      });
      
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzingGoalId(null);
    }
  };

  const updateProgress = async (goalId: string, newValue: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const isCompleted = newValue >= goal.target_value;
      
      const { error } = await supabase
        .from('goals')
        .update({ 
          current_value: newValue,
          is_completed: isCompleted
        })
        .eq('id', goalId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('goal_progress')
          .insert({
            goal_id: goalId,
            user_id: user.id,
            progress_value: newValue,
            notes: `Updated progress to ${newValue} ${goal.unit}`
          });
      }

      if (isCompleted && !goal.is_completed) {
        toast({
          title: "🎉 Goal Completed!",
          description: `Congratulations on achieving "${goal.title}"!`,
        });
      }

      fetchGoals();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update progress",
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      
      toast({
        title: "Goal deleted",
        description: "Your goal has been removed",
      });
      
      fetchGoals();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete goal",
        variant: "destructive",
      });
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading goals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Goal Tracker & Dream Analyzer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your progress and get AI-powered insights to achieve your dreams
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Read 12 books this year"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue">Target *</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="12"
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="books"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentValue">Current Progress</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveGoal} className="flex-1">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your progress by creating your first goal
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => {
            const progressPercentage = getProgressPercentage(goal.current_value, goal.target_value);
            
            return (
              <Card key={goal.id} className={goal.is_completed ? 'border-green-200 bg-green-50' : ''}>
                <Tabs defaultValue="progress" className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => analyzeGoal(goal)}
                          disabled={analyzingGoalId === goal.id}
                          title="Get AI-powered insights"
                        >
                          {analyzingGoalId === goal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(goal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    )}
                    
                    <TabsList className="mt-2">
                      <TabsTrigger value="progress">Progress</TabsTrigger>
                      {goal.analysis && <TabsTrigger value="analysis">AI Insights</TabsTrigger>}
                    </TabsList>
                  </CardHeader>
                  
                  <CardContent>
                    <TabsContent value="progress" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">
                            {goal.current_value} / {goal.target_value} {goal.unit}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="text-xs text-muted-foreground text-right">
                          {progressPercentage.toFixed(1)}% complete
                        </div>
                      </div>
                      
                      {goal.target_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Target: {format(new Date(goal.target_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                      
                      {goal.is_completed && (
                        <div className="text-green-600 font-medium text-sm flex items-center gap-2">
                          ✅ Goal Completed!
                        </div>
                      )}
                      
                      {!goal.is_completed && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Update progress"
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                if (!isNaN(value)) {
                                  updateProgress(goal.id, value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                              const value = parseFloat(input.value);
                              if (!isNaN(value)) {
                                updateProgress(goal.id, value);
                                input.value = '';
                              }
                            }}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    {goal.analysis && (
                      <TabsContent value="analysis" className="space-y-4 mt-0">
                        {/* Summary */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">{goal.analysis.summary}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{goal.analysis.category}</Badge>
                            <Badge className={getFeasibilityColor(goal.analysis.feasibility)}>
                              {goal.analysis.feasibility} feasibility
                            </Badge>
                            <Badge variant="outline">{goal.analysis.uniqueness}</Badge>
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {goal.analysis.timeframe}
                            </Badge>
                          </div>
                        </div>

                        <Separator />

                        {/* Key Steps */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Key Steps
                          </h4>
                          <ol className="space-y-1 text-sm">
                            {goal.analysis.keySteps.map((step, index) => (
                              <li key={index} className="flex gap-2">
                                <span className="font-semibold text-primary">{index + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Action Plan Highlights */}
                        {goal.analysis.actionPlan && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              {goal.analysis.actionPlan.dailyHabits && goal.analysis.actionPlan.dailyHabits.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm">Daily Habits</h4>
                                  <ul className="space-y-1">
                                    {goal.analysis.actionPlan.dailyHabits.slice(0, 3).map((habit, i) => (
                                      <li key={i} className="flex gap-2 text-xs">
                                        <span>✓</span>
                                        <span>{habit}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {goal.analysis.actionPlan.skills && goal.analysis.actionPlan.skills.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm">Skills to Develop</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {goal.analysis.actionPlan.skills.map((skill, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Challenges & Resources */}
                        <Separator />
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Challenges</h4>
                            <ul className="space-y-1">
                              {goal.analysis.challenges.slice(0, 3).map((challenge, index) => (
                                <li key={index} className="flex gap-2 text-xs">
                                  <span>⚠️</span>
                                  <span>{challenge}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Resources</h4>
                            <ul className="space-y-1">
                              {goal.analysis.resources.slice(0, 3).map((resource, index) => (
                                <li key={index} className="flex gap-2 text-xs">
                                  <span>📚</span>
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Success Stories */}
                        {goal.analysis.inspiringExamples && goal.analysis.inspiringExamples.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Success Stories
                              </h4>
                              <div className="space-y-2">
                                {goal.analysis.inspiringExamples.slice(0, 2).map((example, index) => (
                                  <div key={index} className="text-xs">
                                    <a 
                                      href={example.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline font-medium"
                                    >
                                      {example.title}
                                    </a>
                                    <p className="text-muted-foreground line-clamp-2 mt-0.5">
                                      {example.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </TabsContent>
                    )}
                  </CardContent>
                </Tabs>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalTracker;