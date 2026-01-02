import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!message) {
      throw new Error('Message is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's journals (last 30 entries)
    const { data: journals, error: journalsError } = await supabase
      .from('journals')
      .select('title, content, mood, entry_date, journal_type')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(30);

    if (journalsError) {
      console.error('Error fetching journals:', journalsError);
    }

    // Fetch user's goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('title, description, current_value, target_value, target_date, is_completed, unit')
      .eq('user_id', userId);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
    }

    // Fetch user's insights
    const { data: insights, error: insightsError } = await supabase
      .from('user_insights')
      .select('insight_type, title, content, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, profession, goal_in_life, age')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Build context for the AI
    const journalSummary = journals?.map(j => 
      `[${j.entry_date}] ${j.journal_type} - Mood: ${j.mood || 'not set'}\nTitle: ${j.title || 'Untitled'}\nContent: ${j.content?.substring(0, 300)}...`
    ).join('\n\n') || 'No journal entries found.';

    const goalsSummary = goals?.map(g => 
      `Goal: ${g.title}\nDescription: ${g.description || 'N/A'}\nProgress: ${g.current_value}/${g.target_value} ${g.unit || ''}\nTarget Date: ${g.target_date || 'Not set'}\nCompleted: ${g.is_completed ? 'Yes' : 'No'}`
    ).join('\n\n') || 'No goals set.';

    const insightsSummary = insights?.map(i => 
      `[${i.insight_type}] ${i.title}\n${i.content}`
    ).join('\n\n') || 'No insights generated yet.';

    const profileInfo = profile ? 
      `Name: ${profile.full_name || 'Not set'}\nProfession: ${profile.profession || 'Not set'}\nLife Goal: ${profile.goal_in_life || 'Not set'}\nAge: ${profile.age || 'Not set'}` : 
      'Profile not set up.';

    const systemPrompt = `You are a personal wellness and productivity coach AI assistant. You have access to the user's journal entries, goals, insights, and profile information. Use this context to provide personalized, actionable advice.

USER PROFILE:
${profileInfo}

RECENT JOURNAL ENTRIES (Last 30):
${journalSummary}

USER'S GOALS:
${goalsSummary}

AI-GENERATED INSIGHTS:
${insightsSummary}

INSTRUCTIONS:
1. Answer the user's questions based on their personal data and patterns
2. Provide specific, actionable advice tailored to their situation
3. Reference their actual journal entries, goals, and insights when relevant
4. Be empathetic and supportive
5. If they ask about improving something, use their actual data to give personalized recommendations
6. Keep responses concise but helpful (2-4 paragraphs max)
7. Use their name if available in the profile`;

    console.log('Sending request to Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: {
        journalsAnalyzed: journals?.length || 0,
        goalsCount: goals?.length || 0,
        hasInsights: (insights?.length || 0) > 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
