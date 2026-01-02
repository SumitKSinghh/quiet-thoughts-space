import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('userId is required');
    }

    console.log('Generating insights for user:', userId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's recent journals (last 30 entries)
    const { data: journals, error: journalsError } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(30);

    if (journalsError) {
      console.error('Error fetching journals:', journalsError);
      throw journalsError;
    }

    // Fetch user's goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      throw goalsError;
    }

    // Fetch user's smart tags
    const { data: smartTags, error: tagsError } = await supabase
      .from('journal_smart_tags')
      .select('*')
      .eq('user_id', userId);

    if (tagsError) {
      console.error('Error fetching smart tags:', tagsError);
      throw tagsError;
    }

    // Fetch user profile for context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    // Prepare data summary for AI
    const journalSummary = journals?.map(j => ({
      date: j.entry_date,
      mood: j.mood,
      type: j.journal_type,
      content: j.content?.substring(0, 500), // Limit content length
      title: j.title
    })) || [];

    const goalsSummary = goals?.map(g => ({
      title: g.title,
      description: g.description,
      target_value: g.target_value,
      current_value: g.current_value,
      is_completed: g.is_completed,
      target_date: g.target_date
    })) || [];

    const tagsSummary = smartTags?.reduce((acc: Record<string, string[]>, tag) => {
      if (!acc[tag.tag_type]) {
        acc[tag.tag_type] = [];
      }
      if (!acc[tag.tag_type].includes(tag.tag_value)) {
        acc[tag.tag_type].push(tag.tag_value);
      }
      return acc;
    }, {}) || {};

    const userContext = profile ? {
      profession: profile.profession,
      goal_in_life: profile.goal_in_life
    } : null;

    const systemPrompt = `You are an empathetic and insightful personal wellness AI assistant. Analyze the user's journal entries, moods, goals, and tags to provide meaningful, personalized insights.

Your analysis should include:
1. MOOD PATTERNS: Identify emotional trends, triggers, and patterns over time
2. GOAL PROGRESS: Assess how the user is progressing toward their goals based on journal content
3. ACTIONABLE SUGGESTIONS: Provide 3-5 specific, practical recommendations

Be supportive, constructive, and specific. Reference actual content from their journals when making observations. Avoid generic advice.

Respond in this exact JSON format:
{
  "mood_patterns": {
    "title": "Your Mood Journey",
    "content": "Analysis of mood patterns...",
    "trends": ["trend1", "trend2"]
  },
  "goal_progress": {
    "title": "Goal Progress Insights",
    "content": "Analysis of goal-related activities...",
    "observations": ["observation1", "observation2"]
  },
  "suggestions": {
    "title": "Personalized Recommendations",
    "content": "Overall suggestions intro...",
    "items": [
      {"suggestion": "Specific suggestion 1", "reason": "Why this helps"},
      {"suggestion": "Specific suggestion 2", "reason": "Why this helps"},
      {"suggestion": "Specific suggestion 3", "reason": "Why this helps"}
    ]
  },
  "overall": {
    "title": "Weekly Wellness Summary",
    "content": "A brief, encouraging summary of their overall state and key takeaways..."
  }
}`;

    const userPrompt = `Please analyze my journal data and provide personalized insights:

${userContext ? `**About Me:**
- Profession: ${userContext.profession || 'Not specified'}
- Life Goal: ${userContext.goal_in_life || 'Not specified'}` : ''}

**My Goals (${goalsSummary.length} total):**
${JSON.stringify(goalsSummary, null, 2)}

**Recent Journal Entries (${journalSummary.length} entries):**
${JSON.stringify(journalSummary, null, 2)}

**Topics & Themes from my journals:**
${JSON.stringify(tagsSummary, null, 2)}

Please provide thoughtful insights based on this data.`;

    console.log('Calling Lovable AI for insights generation...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insightsText = aiData.choices?.[0]?.message?.content;

    if (!insightsText) {
      throw new Error('No insights generated from AI');
    }

    console.log('AI response received, parsing insights...');

    // Parse the JSON response
    let insights;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = insightsText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        insightsText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : insightsText;
      insights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw response:', insightsText);
      // Create a fallback structure
      insights = {
        overall: {
          title: 'Wellness Insights',
          content: insightsText
        }
      };
    }

    // Delete old insights for this user
    const { error: deleteError } = await supabase
      .from('user_insights')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting old insights:', deleteError);
    }

    // Insert new insights
    const insightsToInsert = [];
    const entriesCount = journals?.length || 0;

    if (insights.mood_patterns) {
      insightsToInsert.push({
        user_id: userId,
        insight_type: 'mood_pattern',
        title: insights.mood_patterns.title,
        content: insights.mood_patterns.content,
        metadata: { trends: insights.mood_patterns.trends || [] },
        analyzed_entries_count: entriesCount,
      });
    }

    if (insights.goal_progress) {
      insightsToInsert.push({
        user_id: userId,
        insight_type: 'goal_progress',
        title: insights.goal_progress.title,
        content: insights.goal_progress.content,
        metadata: { observations: insights.goal_progress.observations || [] },
        analyzed_entries_count: entriesCount,
      });
    }

    if (insights.suggestions) {
      insightsToInsert.push({
        user_id: userId,
        insight_type: 'suggestion',
        title: insights.suggestions.title,
        content: insights.suggestions.content,
        metadata: { items: insights.suggestions.items || [] },
        analyzed_entries_count: entriesCount,
      });
    }

    if (insights.overall) {
      insightsToInsert.push({
        user_id: userId,
        insight_type: 'overall',
        title: insights.overall.title,
        content: insights.overall.content,
        metadata: {},
        analyzed_entries_count: entriesCount,
      });
    }

    if (insightsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('user_insights')
        .insert(insightsToInsert);

      if (insertError) {
        console.error('Error inserting insights:', insertError);
        throw insertError;
      }
    }

    console.log('Successfully generated and stored insights for user:', userId);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Insights generated successfully',
      insights_count: insightsToInsert.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-user-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
