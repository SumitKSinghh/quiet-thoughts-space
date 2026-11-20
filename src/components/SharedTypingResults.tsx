import { useEffect, useState } from "react";
import { Award, Keyboard, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SharedResult {
  id: string;
  user_id: string;
  passage_title: string;
  words_per_minute: number;
  accuracy: number;
  created_at: string;
}

const SharedTypingResults = () => {
  const [results, setResults] = useState<SharedResult[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSharedResults = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("typing_test_results")
        .select("id, user_id, passage_title, words_per_minute, accuracy, created_at")
        .eq("is_shared", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        toast({ title: "Could not load shared typing scores", description: error.message, variant: "destructive" });
      } else {
        setResults((data || []) as SharedResult[]);
      }
      setLoading(false);
    };

    void loadSharedResults();
  }, [toast]);

  return (
    <section className="mb-10" aria-labelledby="community-typing-heading">
      <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
            <Award className="h-4 w-4" />
            Let’s Improve
          </div>
          <h2 id="community-typing-heading" className="text-2xl font-bold text-foreground">Typing test board</h2>
        </div>
        {results.length > 0 && <Badge variant="outline">{results.length} shared {results.length === 1 ? "result" : "results"}</Badge>}
      </div>

      {loading ? (
        <p className="py-6 text-sm text-muted-foreground">Loading shared scores…</p>
      ) : results.length === 0 ? (
        <div className="border-b border-border py-6 text-sm text-muted-foreground">
          No typing scores have been shared yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <Card key={result.id} className="rounded-lg border-border shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {result.user_id === currentUserId ? "Your score" : "Community member"}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{result.passage_title}</div>
                  </div>
                  <Keyboard className="h-4 w-4 shrink-0 text-primary" />
                </div>
                <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                  <div>
                    <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                      {result.words_per_minute}<span className="ml-1 text-xs font-normal text-muted-foreground">WPM</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(result.created_at).toLocaleDateString()}</div>
                  </div>
                  <Badge variant="secondary" className="gap-1"><Target className="h-3 w-3" /> {result.accuracy}%</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default SharedTypingResults;