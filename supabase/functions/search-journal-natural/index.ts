import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's journals with smart tags
    const { data: journals, error: journalsError } = await supabase
      .from('journals')
      .select(`
        id, title, content, entry_date, mood, created_at,
        journal_smart_tags (tag_type, tag_value, confidence_score)
      `)
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });

    if (journalsError) {
      console.error('Error fetching journals:', journalsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch journals' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!journals || journals.length === 0) {
      return new Response(
        JSON.stringify({ matchingJournals: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a summary of available data for AI analysis
    const journalSummary = journals.map(journal => ({
      id: journal.id,
      title: journal.title || 'Untitled',
      content_preview: journal.content.substring(0, 200),
      entry_date: journal.entry_date,
      mood: journal.mood,
      tags: journal.journal_smart_tags?.map(tag => `${tag.tag_type}:${tag.tag_value}`).join(', ') || ''
    }));

    // Use OpenAI to interpret the natural language query
    const analysisPrompt = `Given this natural language search query: "${query}"

And these available journal entries:
${journalSummary.map(j => `ID: ${j.id}, Date: ${j.entry_date}, Mood: ${j.mood || 'none'}, Tags: ${j.tags}, Title: ${j.title}, Preview: ${j.content_preview}`).join('\n')}

Return a JSON object with:
{
  "matchingJournals": ["journal-id-1", "journal-id-2"], // IDs of entries that match the query
  "reasoning": "Brief explanation of why these entries match"
}

Consider:
- Date references (last week, March, summer, etc.)
- Mood keywords (happy, sad, excited, etc.) 
- Topic keywords (work, family, exercise, etc.)
- People or activity mentions
- Any smart tags that might be relevant

Be selective - only return entries that genuinely match the query intent.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at interpreting natural language search queries and matching them to journal entries. Always respond with valid JSON only.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to process search query' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const resultText = aiResponse.choices[0]?.message?.content;
    
    if (!resultText) {
      console.error('No content in OpenAI response');
      return new Response(
        JSON.stringify({ matchingJournals: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let searchResult;
    try {
      searchResult = JSON.parse(resultText);
    } catch (error) {
      console.error('Failed to parse AI response:', resultText);
      return new Response(
        JSON.stringify({ matchingJournals: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Natural language search for "${query}" found ${searchResult.matchingJournals?.length || 0} matches`);
    console.log('Reasoning:', searchResult.reasoning);

    return new Response(
      JSON.stringify({
        matchingJournals: searchResult.matchingJournals || [],
        reasoning: searchResult.reasoning,
        totalJournals: journals.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-journal-natural function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});