import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Calendar as CalendarIcon, Save, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JournalAttachments } from './JournalAttachments';
import { uploadAttachments, loadAttachments, type Attachment } from './JournalAttachmentHelpers';

interface JournalEditorProps {
  journal?: any;
  selectedDate: Date;
  onBack: () => void;
  onSave: () => void;
}

const JournalEditorSimple = ({ journal, selectedDate, onBack, onSave }: JournalEditorProps) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(selectedDate);
  const [journalType, setJournalType] = useState<'gratitude' | 'fitness' | 'dreams' | 'daily'>('daily');
  const [mood, setMood] = useState<'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' | 'none'>('none');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Simple JournalEditor useEffect triggered');
    const initializeEditor = async () => {
      if (journal) {
        console.log('Editing existing journal:', journal);
        setContent(journal.content || '');
        setTitle(journal.title || '');
        const journalDate = new Date(journal.entry_date);
        setDate(isNaN(journalDate.getTime()) ? selectedDate : journalDate);
        setJournalType(journal.journal_type || 'daily');
        setMood(journal.mood || 'none');
        setIsPublic(journal.is_public || false);
        
        // Load existing attachments
        try {
          const journalAttachments = await loadAttachments(journal.id);
          setAttachments(journalAttachments);
        } catch (error) {
          console.error('Error loading attachments:', error);
        }
      } else {
        console.log('Creating new journal entry');
        setContent('');
        setTitle('');
        setDate(selectedDate);
        setJournalType('daily');
        setMood('none');
        setAttachments([]);
        setIsPublic(false);
      }
    };
    
    initializeEditor();
  }, [journal, selectedDate]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something in your journal entry.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save or update journal entry (without todos for now)
      let journalId: string;

      if (journal) {
        const { error } = await supabase
          .from('journals')
          .update({
            title: title.trim() || null,
            content: content.trim(),
            entry_date: format(date, 'yyyy-MM-dd'),
            journal_type: journalType,
            mood: mood === 'none' ? null : mood,
            is_public: isPublic,
          })
          .eq('id', journal.id);

        if (error) throw error;
        journalId = journal.id;
      } else {
        const { data: newJournal, error } = await supabase
          .from('journals')
          .insert([{
            user_id: user.id,
            title: title.trim() || null,
            content: content.trim(),
            entry_date: format(date, 'yyyy-MM-dd'),
            journal_type: journalType,
            mood: mood === 'none' ? null : mood,
            is_public: isPublic,
          }])
          .select()
          .single();

        if (error) throw error;
        journalId = newJournal.id;
      }

      // Upload and save attachments
      if (attachments.length > 0) {
        try {
          await uploadAttachments(attachments, journalId, user.id);
        } catch (attachmentError) {
          console.error('Error uploading attachments:', attachmentError);
          toast({
            title: "Warning",
            description: "Journal saved but some attachments failed to upload.",
            variant: "destructive",
          });
        }
      }

      // Generate smart tags for the journal entry
      try {
        await supabase.functions.invoke('analyze-journal-entry', {
          body: {
            journalId: journalId,
            content: content.trim(),
            title: title.trim() || null
          }
        });
      } catch (tagError) {
        console.error('Failed to generate smart tags:', tagError);
        // Don't fail the save operation if tag generation fails
      }

      toast({
        title: "Journal saved",
        description: "Your entry has been saved successfully.",
      });

      onSave();
    } catch (error: any) {
      console.error('Error saving journal:', error);
      toast({
        title: "Error saving journal",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Entries
        </Button>
        
        <h2 className="text-2xl font-bold text-gray-900">
          {journal ? 'Edit Entry' : 'New Journal Entry'}
        </h2>
        
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entry Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate);
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Journal Type and Mood */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Journal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journal-type">Journal Type</Label>
                <Select value={journalType} onValueChange={(value) => setJournalType(value as 'gratitude' | 'fitness' | 'dreams' | 'daily')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select journal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">📝 Daily Journal</SelectItem>
                    <SelectItem value="gratitude">🙏 Gratitude</SelectItem>
                    <SelectItem value="fitness">💪 Fitness</SelectItem>
                    <SelectItem value="dreams">💭 Dreams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mood">Mood (Optional)</Label>
                <Select value={mood} onValueChange={(value) => setMood(value as 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' | 'none')}>
                  <SelectTrigger>
                    <SelectValue placeholder="How are you feeling?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No mood selected</SelectItem>
                    <SelectItem value="excellent">😄 Excellent</SelectItem>
                    <SelectItem value="good">😊 Good</SelectItem>
                    <SelectItem value="neutral">😐 Neutral</SelectItem>
                    <SelectItem value="bad">😞 Bad</SelectItem>
                    <SelectItem value="terrible">😢 Terrible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Title */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Title (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Give your entry a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-gray-200 focus:border-blue-500"
            />
          </CardContent>
        </Card>

        {/* Journal Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What's on your mind?</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write about your day, thoughts, experiences, or anything you'd like to remember..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] resize-none border-gray-200 focus:border-blue-500"
            />
          </CardContent>
        </Card>

        {/* Attachments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <JournalAttachments
              journalId={journal?.id}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              isEditing={true}
            />
          </CardContent>
        </Card>

        {/* Share to Community */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Community Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Share to Community</p>
                  <p className="text-sm text-muted-foreground">
                    Make this journal visible to other users in the community
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JournalEditorSimple;