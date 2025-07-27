import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Upload, Play, Pause, Square } from 'lucide-react';

interface VoiceJournalProps {
  onSave: () => void;
}

const VoiceJournal: React.FC<VoiceJournalProps> = ({ onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your journal entry now",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "You can now play back or transcribe your recording",
      });
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      audioElementRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(audioUrl);
        audioElementRef.current.onended = () => setIsPlaying(false);
      }
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (base64Audio) {
          // Call edge function for transcription
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });

          if (error) throw error;
          
          setTranscription(data.text || '');
          toast({
            title: "Transcription complete",
            description: "Your audio has been converted to text",
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Transcription failed",
        description: "Could not convert speech to text",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const saveVoiceJournal = async () => {
    if (!audioBlob && !transcription.trim()) {
      toast({
        title: "Nothing to save",
        description: "Please record audio or add text",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let audioStorageUrl = null;
      
      // Upload audio file if exists
      if (audioBlob) {
        const fileName = `${user.id}/${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voice-recordings')
          .upload(fileName, audioBlob);

        if (uploadError) throw uploadError;
        audioStorageUrl = uploadData.path;
      }

      // Save journal entry
      const { error: insertError } = await supabase
        .from('journals')
        .insert({
          user_id: user.id,
          title: 'Voice Journal Entry',
          content: transcription.trim() || 'Voice recording (no transcription)',
          entry_date: new Date().toISOString().split('T')[0],
          journal_type: 'daily',
          audio_url: audioStorageUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Voice journal saved",
        description: "Your entry has been saved successfully",
      });

      // Reset form
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscription('');
      setIsPlaying(false);
      
      onSave();
    } catch (error) {
      console.error('Error saving voice journal:', error);
      toast({
        title: "Save failed",
        description: "Could not save your journal entry",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Controls */}
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="text-center">
            <div className="animate-pulse text-red-500 font-medium">
              🔴 Recording in progress...
            </div>
          </div>
        )}

        {/* Playback Controls */}
        {audioUrl && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={togglePlayback}
                variant="outline"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>
              
              <Button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isTranscribing ? 'Transcribing...' : 'Transcribe'}
              </Button>
            </div>
          </div>
        )}

        {/* Transcription */}
        {transcription && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Transcription:</label>
            <Textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Edit your transcribed text here..."
              rows={6}
            />
          </div>
        )}

        {/* Save Button */}
        {(audioBlob || transcription.trim()) && (
          <div className="flex justify-center">
            <Button
              onClick={saveVoiceJournal}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isSaving ? 'Saving...' : 'Save Voice Journal'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceJournal;