import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dreamText, dreamId } = await req.json();
    
    if (!dreamText) {
      throw new Error('Dream text is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Analyze the dream with AI
    const analysisPrompt = `You are a dream analysis and goal achievement expert. Analyze the following dream/goal:

"${dreamText}"

Provide a comprehensive analysis in the following JSON format:
{
  "summary": "Brief summary of the dream/goal",
  "category": "Category (e.g., Career, Personal Development, Creative, Business, Health, etc.)",
  "feasibility": "high|medium|low",
  "uniqueness": "common|unique|groundbreaking",
  "timeframe": "Estimated timeframe to achieve (e.g., 6 months, 2 years, 5+ years)",
  "keySteps": ["Step 1", "Step 2", "Step 3", ...],
  "challenges": ["Challenge 1", "Challenge 2", ...],
  "resources": ["Resource 1", "Resource 2", ...],
  "searchQuery": "Optimal search query to find people who achieved similar goals"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert dream analyzer and goal achievement coach. Always respond with valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Parse the JSON response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    // Step 2: Search for people who achieved similar goals
    const searchQuery = analysis.searchQuery || `${analysis.category} success stories ${analysis.summary}`;
    
    const searchResponse = await fetch('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'X-Subscription-Token': Deno.env.get('BRAVE_API_KEY') || '',
      },
    }).catch(() => null);

    let inspiringExamples = [];
    if (searchResponse && searchResponse.ok) {
      const searchData = await searchResponse.json();
      inspiringExamples = searchData.results?.slice(0, 5).map((result: any) => ({
        title: result.title,
        description: result.description,
        url: result.url,
      })) || [];
    }

    // Step 3: Generate detailed action plan
    const actionPlanPrompt = `Based on this dream/goal analysis:
${JSON.stringify(analysis, null, 2)}

Create a detailed, actionable plan with specific steps, milestones, and resources. Format as JSON:
{
  "milestones": [
    {
      "title": "Milestone name",
      "timeframe": "When to achieve",
      "actions": ["Action 1", "Action 2"],
      "metrics": "How to measure success"
    }
  ],
  "dailyHabits": ["Habit 1", "Habit 2"],
  "weeklyGoals": ["Goal 1", "Goal 2"],
  "monthlyReview": ["Review point 1", "Review point 2"],
  "networking": ["Connection type 1", "Connection type 2"],
  "skills": ["Skill 1 to develop", "Skill 2 to develop"]
}`;

    const planResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert goal planning coach. Always respond with valid JSON only.' },
          { role: 'user', content: actionPlanPrompt }
        ],
        temperature: 0.7,
      }),
    });

    const planData = await planResponse.json();
    const planText = planData.choices[0].message.content;
    const planJsonMatch = planText.match(/\{[\s\S]*\}/);
    const actionPlan = planJsonMatch ? JSON.parse(planJsonMatch[0]) : {};

    // Combine all analysis
    const fullAnalysis = {
      ...analysis,
      actionPlan,
      inspiringExamples,
      analyzedAt: new Date().toISOString(),
    };

    // Save to database if dreamId provided
    if (dreamId) {
      const { error: updateError } = await supabase
        .from('dreams')
        .update({ 
          analysis: fullAnalysis,
          updated_at: new Date().toISOString()
        })
        .eq('id', dreamId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, analysis: fullAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});