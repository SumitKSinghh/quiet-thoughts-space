import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GoogleCalendarTokens {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

interface GoogleCalendarIntegrationProps {
  onTokensUpdate?: (hasTokens: boolean) => void;
}

export const GoogleCalendarIntegration = ({ onTokensUpdate }: GoogleCalendarIntegrationProps) => {
  const [tokens, setTokens] = useState<GoogleCalendarTokens | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkExistingTokens();
  }, []);

  const checkExistingTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching tokens:', error);
        return;
      }

      if (data) {
        setTokens(data);
        onTokensUpdate?.(true);
      } else {
        onTokensUpdate?.(false);
      }
    } catch (error) {
      console.error('Error checking tokens:', error);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'get_auth_url',
          redirectUri
        }
      });

      if (error) throw error;

      // Open Google auth in a popup
      const popup = window.open(
        data.authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          handleAuthCallback(event.data.code);
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthCallback = async (code: string) => {
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'exchange_code',
          code,
          redirectUri
        }
      });

      if (error) throw error;

      // Store tokens in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

      const { error: insertError } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: user.id,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: expiresAt
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Google Calendar connected successfully!",
      });

      checkExistingTokens();
    } catch (error: any) {
      console.error('Token exchange error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setTokens(null);
      onTokensUpdate?.(false);
      
      toast({
        title: "Disconnected",
        description: "Google Calendar has been disconnected.",
      });
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync tasks and get notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tokens ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Connected to Google Calendar
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your tasks will now automatically sync with Google Calendar. You'll receive notifications for important tasks!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to automatically create calendar events for your tasks and receive notifications.
            </p>
            <Button 
              onClick={handleGoogleAuth} 
              disabled={isLoading}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isLoading ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};