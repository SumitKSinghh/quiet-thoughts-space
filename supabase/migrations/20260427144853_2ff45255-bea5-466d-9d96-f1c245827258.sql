CREATE TABLE public.hour_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL,
  hour_slot INTEGER NOT NULL CHECK (hour_slot >= 0 AND hour_slot <= 23),
  activity TEXT NOT NULL,
  category TEXT,
  productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date, hour_slot)
);

ALTER TABLE public.hour_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hour logs" ON public.hour_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own hour logs" ON public.hour_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own hour logs" ON public.hour_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own hour logs" ON public.hour_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_hour_logs_updated_at
BEFORE UPDATE ON public.hour_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_hour_logs_user_date ON public.hour_logs(user_id, log_date DESC);