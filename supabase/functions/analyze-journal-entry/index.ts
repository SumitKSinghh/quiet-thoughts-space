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
    const { journalId, content, title } = await req.json();
    
    if (!journalId || !content) {
      return new Response(
        JSON.stringify({ error: 'Journal ID and content are required' }), 
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

    // Analyze the journal entry using OpenAI
    const analysisPrompt = `Analyze this journal entry and extract relevant tags. Return a JSON object with the following structure:
{
  "mood": ["happy", "excited", "calm"], // emotional states detected
  "topics": ["work", "family", "exercise"], // main subjects/themes
  "people": ["John", "Sarah"], // people mentioned (first names only)
  "activities": ["running", "cooking", "meeting"], // activities mentioned
  "locations": ["park", "office", "home"] // places mentioned
}

Only include tags that are clearly present in the text. Be concise and relevant. Here's the entry:

Title: ${title || ''}
Content: ${content}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing text and extracting meaningful tags. Always respond with valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to analyze entry' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0]?.message?.content;
    
    if (!analysisText) {
      console.error('No content in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'No analysis generated' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let tags;
    try {
      tags = JSON.parse(analysisText);
    } catch (error) {
      console.error('Failed to parse AI response:', analysisText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from the journal entry
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('user_id')
      .eq('id', journalId)
      .single();

    if (journalError || !journal) {
      console.error('Failed to fetch journal:', journalError);
      return new Response(
        JSON.stringify({ error: 'Journal not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing smart tags for this journal entry
    await supabase
      .from('journal_smart_tags')
      .delete()
      .eq('journal_id', journalId);

    // Insert new smart tags
    const smartTags = [];
    
    Object.entries(tags).forEach(([tagType, tagValues]) => {
      if (Array.isArray(tagValues)) {
        tagValues.forEach(tagValue => {
          if (tagValue && typeof tagValue === 'string') {
            smartTags.push({
              journal_id: journalId,
              user_id: journal.user_id,
              tag_type: tagType,
              tag_value: tagValue.toLowerCase(),
              confidence_score: 0.8
            });
          }
        });
      }
    });

    if (smartTags.length > 0) {
      const { error: insertError } = await supabase
        .from('journal_smart_tags')
        .insert(smartTags);

      if (insertError) {
        console.error('Failed to insert smart tags:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save tags' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Generated ${smartTags.length} smart tags for journal ${journalId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        tagsGenerated: smartTags.length,
        tags: tags
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-journal-entry function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});