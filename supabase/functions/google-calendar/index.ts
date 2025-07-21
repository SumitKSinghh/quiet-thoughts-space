import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()

    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Google Calendar credentials not configured')
    }

    switch (action) {
      case 'get_auth_url':
        const authUrl = getAuthUrl(clientId, params.redirectUri)
        return new Response(JSON.stringify({ authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'exchange_code':
        const tokens = await exchangeCodeForTokens(params.code, clientId, clientSecret, params.redirectUri)
        return new Response(JSON.stringify(tokens), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'create_event':
        const event = await createCalendarEvent(params.accessToken, params.eventData)
        return new Response(JSON.stringify(event), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'refresh_token':
        const newTokens = await refreshAccessToken(params.refreshToken, clientId, clientSecret)
        return new Response(JSON.stringify(newTokens), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Google Calendar API error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function getAuthUrl(clientId: string, redirectUri: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ].join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent'
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function exchangeCodeForTokens(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens')
  }

  return await response.json()
}

async function createCalendarEvent(accessToken: string, eventData: any) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  })

  if (!response.ok) {
    throw new Error('Failed to create calendar event')
  }

  return await response.json()
}

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  return await response.json()
}