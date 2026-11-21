import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Award,
  Check,
  Clock3,
  Keyboard,
  RotateCcw,
  Share2,
  Target,
  TimerReset,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateTypingScore, TYPING_TEST_DURATION_SECONDS } from "@/lib/typingTest";
import { createMixedPassage } from "@/lib/typingTestPassages";

interface SavedAttempt {
  id: string;
  passage_title: string;
  words_per_minute: number;
  accuracy: number;
  characters_typed: number;
  error_count: number;
  duration_seconds: number;
  is_shared: boolean;
  created_at: string;
}

interface TypingTestProps {
  userId: string | null;
}

type TestState = "ready" | "running" | "finished";

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const TypingTest = ({ userId }: TypingTestProps) => {
  const [testState, setTestState] = useState<TestState>("ready");
  const [passage, setPassage] = useState(() => createMixedPassage());
  const [typedText, setTypedText] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(TYPING_TEST_DURATION_SECONDS);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [savedAttempt, setSavedAttempt] = useState<SavedAttempt | null>(null);
  const [history, setHistory] = useState<SavedAttempt[]>([]);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latestTypedText = useRef(typedText);
  const savedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    latestTypedText.current = typedText;
  }, [typedText]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("typing_test_results")
      .select("id, passage_title, words_per_minute, accuracy, characters_typed, error_count, duration_seconds, is_shared, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      toast({ title: "Could not load practice history", description: error.message, variant: "destructive" });
      return;
    }
    setHistory((data || []) as SavedAttempt[]);
  }, [toast, userId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (testState !== "running" || startedAt === null) return;

    const updateTimer = () => {
      const secondsLeft = Math.max(
        0,
        TYPING_TEST_DURATION_SECONDS - Math.floor((Date.now() - startedAt) / 1000),
      );
      setRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) setTestState("finished");
    };

    updateTimer();
    const intervalId = window.setInterval(updateTimer, 150);
    return () => window.clearInterval(intervalId);
  }, [startedAt, testState]);

  useEffect(() => {
    if (testState !== "finished" || !userId || savedRef.current) return;

    savedRef.current = true;
    const score = calculateTypingScore(
      latestTypedText.current,
      passage.text,
      TYPING_TEST_DURATION_SECONDS,
    );

    const saveResult = async () => {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        setSaving(false);
        toast({ title: "Sign in to save your score", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase
        .from("typing_test_results")
        .insert({
          user_id: userId,
          passage_title: passage.title,
          passage_category: "Mixed",
          passage_text: passage.text,
          words_per_minute: score.wordsPerMinute,
          accuracy: score.accuracy,
          characters_typed: score.charactersTyped,
          error_count: score.errorCount,
          duration_seconds: TYPING_TEST_DURATION_SECONDS,
        })
        .select("id, passage_title, words_per_minute, accuracy, characters_typed, error_count, duration_seconds, is_shared, created_at")
        .single();

      if (error) {
        toast({ title: "Score shown, but could not be saved", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }

      setSavedAttempt(data as SavedAttempt);
      setHistory((previous) => [data as SavedAttempt, ...previous].slice(0, 5));
      setSaving(false);
    };

    void saveResult();
  }, [passage, testState, toast, userId]);

  const startTest = () => {
    setPassage(createMixedPassage());
    setTypedText("");
    latestTypedText.current = "";
    setRemainingSeconds(TYPING_TEST_DURATION_SECONDS);
    setSavedAttempt(null);
    savedRef.current = false;
    const now = Date.now();
    setStartedAt(now);
    setTestState("running");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const score = calculateTypingScore(
    typedText,
    passage.text,
    TYPING_TEST_DURATION_SECONDS,
  );
  const typedProgress = passage.text.length > 0
    ? Math.round((typedText.length / passage.text.length) * 100)
    : 0;

  const handleShare = async (attempt: SavedAttempt) => {
    if (!userId || sharing) return;
    setSharing(true);
    const nextSharedState = !attempt.is_shared;
    const { error } = await supabase
      .from("typing_test_results")
      .update({ is_shared: nextSharedState })
      .eq("id", attempt.id)
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Could not update sharing", description: error.message, variant: "destructive" });
    } else {
      const updateAttempt = (item: SavedAttempt) =>
        item.id === attempt.id ? { ...item, is_shared: nextSharedState } : item;
      setHistory((previous) => previous.map(updateAttempt));
      setSavedAttempt((previous) => previous ? updateAttempt(previous) : previous);
      toast({
        title: nextSharedState ? "Score shared with the community" : "Score is private again",
        description: nextSharedState ? "Your result is now visible on the community page." : "Your result has been removed from the community page.",
      });
    }
    setSharing(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Keyboard className="h-4 w-4" />
            Practice room
          </div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">Let’s Improve</h1>
          <p className="mt-2 text-muted-foreground">One minute. A fresh mix of passages. Your progress, saved.</p>
        </div>
        <Badge variant="outline" className="w-fit gap-2 py-1.5">
          <Clock3 className="h-3.5 w-3.5" />
          60-second test
        </Badge>
      </header>

      <Card className="overflow-hidden rounded-lg border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border bg-muted/30">
          <div className="min-w-0">
            <CardTitle className="text-lg">Typing test</CardTitle>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {testState === "ready" ? "A new mixed passage is chosen each time." : passage.title}
            </p>
          </div>
          <div
            className={`shrink-0 font-mono text-2xl font-semibold tabular-nums ${remainingSeconds <= 10 && testState === "running" ? "text-destructive" : "text-foreground"}`}
            aria-live="polite"
            aria-label={`${remainingSeconds} seconds remaining`}
          >
            {formatTime(remainingSeconds)}
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-7">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{testState === "running" ? "Passage progress" : "Your next passage"}</span>
            <span>{testState === "running" ? `${typedText.length} / ${passage.text.length} characters` : "4 subjects in each mix"}</span>
          </div>
          <Progress value={testState === "running" ? typedProgress : 0} className="h-1.5" />

          <div
            className="max-h-64 overflow-y-auto rounded-md border border-border bg-muted/20 p-4 font-mono text-base leading-8 sm:p-6 sm:text-lg"
            aria-label="Passage to type"
          >
            {passage.text.split("").map((character, index) => {
              const hasTypedCharacter = index < typedText.length;
              const isCorrect = typedText[index] === character;
              const isCurrentCharacter = index === typedText.length && testState === "running";
              const displayCharacter = character === " " ? "\u00a0" : character;
              return (
                <span
                  key={index}
                  className={hasTypedCharacter
                    ? isCorrect ? "text-primary" : "bg-destructive/15 text-destructive"
                    : isCurrentCharacter ? "rounded-sm bg-accent text-foreground" : "text-muted-foreground/70"}
                >
                  {displayCharacter}
                </span>
              );
            })}
          </div>

          {testState === "running" ? (
            <Textarea
              ref={inputRef}
              value={typedText}
              onChange={(event) => {
                const nextValue = event.target.value.slice(0, passage.text.length);
                latestTypedText.current = nextValue;
                setTypedText(nextValue);
              }}
              onPaste={(event) => event.preventDefault()}
              maxLength={passage.text.length}
              aria-label="Type the passage here"
              placeholder="Begin typing the passage here…"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-h-28 resize-y font-mono text-base leading-7"
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm text-muted-foreground">
                {testState === "finished"
                  ? "Time. Your score is ready below."
                  : "Start the timer, then type the passage before time runs out."}
              </p>
              <Button onClick={startTest} className="shrink-0 gap-2">
                {testState === "finished" ? <RotateCcw className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
                {testState === "finished" ? "Try a new mix" : "Start typing test"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {testState === "finished" && (
        <Card className="rounded-lg border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Award className="h-4 w-4" />
              Your result
            </div>
            <CardTitle className="pt-1 text-xl">One minute, measured.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ScoreMetric label="Words per minute" value={score.wordsPerMinute} icon={<Keyboard className="h-4 w-4" />} />
              <ScoreMetric label="Accuracy" value={`${score.accuracy}%`} icon={<Target className="h-4 w-4" />} />
              <ScoreMetric label="Correct characters" value={score.correctCharacters} icon={<Check className="h-4 w-4" />} />
              <ScoreMetric label="Mistyped" value={score.errorCount} icon={<X className="h-4 w-4" />} />
            </div>
            <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                <TimerReset className="h-4 w-4" />
                {saving ? "Saving your score…" : savedAttempt ? "Score saved to your practice history" : "Your result remains private until you share it"}
              </div>
              {savedAttempt && (
                <Button
                  variant={savedAttempt.is_shared ? "outline" : "default"}
                  className="gap-2"
                  onClick={() => void handleShare(savedAttempt)}
                  disabled={sharing}
                >
                  <Share2 className="h-4 w-4" />
                  {savedAttempt.is_shared ? "Remove from community" : "Share with community"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <section className="space-y-4" aria-labelledby="typing-history-heading">
          <div className="flex items-end justify-between border-b border-border pb-3">
            <div>
              <h2 id="typing-history-heading" className="text-xl font-semibold text-foreground">Recent attempts</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your latest saved scores</p>
            </div>
            <Clock3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {history.map((attempt) => (
              <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{attempt.passage_title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(attempt.created_at).toLocaleDateString()} · {attempt.accuracy}% accuracy
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{attempt.words_per_minute} WPM</span>
                  <Button
                    size="sm"
                    variant={attempt.is_shared ? "outline" : "ghost"}
                    className="gap-2"
                    onClick={() => void handleShare(attempt)}
                    disabled={sharing}
                    aria-label={attempt.is_shared ? "Remove score from community" : "Share score with community"}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{attempt.is_shared ? "Shared" : "Share"}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ScoreMetric = ({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) => (
  <div className="min-w-0 border-l-2 border-primary/30 pl-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</div>
  </div>
);

export default TypingTest;