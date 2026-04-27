import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { days = 7 } = await req.json().catch(() => ({}));

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const { data: logs, error: logsError } = await supabase
      .from('hour_logs')
      .select('log_date, hour_slot, activity, category, productivity_rating, notes')
      .eq('user_id', user.id)
      .gte('log_date', sinceStr)
      .order('log_date', { ascending: false })
      .order('hour_slot', { ascending: true });

    if (logsError) throw logsError;

    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({
        insights: "No hour logs found yet. Start logging your activities to get personalized AI insights about your productivity patterns!",
        stats: null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Compute simple stats
    const avgProductivity = logs.filter(l => l.productivity_rating).reduce((s, l) => s + (l.productivity_rating || 0), 0) / (logs.filter(l => l.productivity_rating).length || 1);
    const categoryCount: Record<string, number> = {};
    const hourProductivity: Record<number, { total: number; count: number }> = {};
    logs.forEach(l => {
      if (l.category) categoryCount[l.category] = (categoryCount[l.category] || 0) + 1;
      if (l.productivity_rating) {
        if (!hourProductivity[l.hour_slot]) hourProductivity[l.hour_slot] = { total: 0, count: 0 };
        hourProductivity[l.hour_slot].total += l.productivity_rating;
        hourProductivity[l.hour_slot].count += 1;
      }
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity coach. Analyze hour-by-hour activity logs and provide concise, actionable insights. Identify peak productive hours, time-wasting patterns, and suggest 3 specific improvements. Be warm and encouraging. Use markdown with clear sections: **Peak Hours**, **Patterns**, **Recommendations**.'
          },
          {
            role: 'user',
            content: `Analyze my hour logs from the last ${days} days (${logs.length} entries):\n\n${JSON.stringify(logs, null, 2)}\n\nAverage productivity: ${avgProductivity.toFixed(1)}/5\nCategory distribution: ${JSON.stringify(categoryCount)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices?.[0]?.message?.content || 'No insights generated.';

    return new Response(JSON.stringify({
      insights,
      stats: {
        totalLogs: logs.length,
        avgProductivity: Number(avgProductivity.toFixed(2)),
        categoryCount,
        hourProductivity: Object.fromEntries(
          Object.entries(hourProductivity).map(([h, v]) => [h, Number((v.total / v.count).toFixed(2))])
        ),
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('analyze-hour-logs error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
