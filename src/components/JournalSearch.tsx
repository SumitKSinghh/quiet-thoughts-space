import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Journal {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  mood: string | null;
  created_at: string;
  smart_tags?: {
    tag_type: string;
    tag_value: string;
    confidence_score: number;
  }[];
}

interface JournalSearchProps {
  onResults: (results: Journal[]) => void;
  allEntries: Journal[];
}

export const JournalSearch: React.FC<JournalSearchProps> = ({ onResults, allEntries }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedTagType, setSelectedTagType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isNaturalLanguageMode, setIsNaturalLanguageMode] = useState(false);
  const [availableTags, setAvailableTags] = useState<{[key: string]: string[]}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load available smart tags
  useEffect(() => {
    const loadAvailableTags = async () => {
      try {
        const { data: tags, error } = await supabase
          .from('journal_smart_tags')
          .select('tag_type, tag_value')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;

        const tagsByType: {[key: string]: string[]} = {};
        tags?.forEach(tag => {
          if (!tagsByType[tag.tag_type]) {
            tagsByType[tag.tag_type] = [];
          }
          if (!tagsByType[tag.tag_type].includes(tag.tag_value)) {
            tagsByType[tag.tag_type].push(tag.tag_value);
          }
        });

        setAvailableTags(tagsByType);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };

    loadAvailableTags();
  }, []);

  // Natural language search
  const handleNaturalLanguageSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-journal-natural', {
        body: { query: searchQuery }
      });

      if (error) throw error;

      // Apply the natural language search results
      const matchingIds = data?.matchingJournals || [];
      const filteredResults = allEntries.filter(entry => 
        matchingIds.includes(entry.id)
      );
      
      onResults(filteredResults);
    } catch (error) {
      console.error('Natural language search failed:', error);
      // Fallback to regular search
      handleRegularSearch();
    } finally {
      setIsLoading(false);
    }
  };

  // Regular search and filter
  const filteredResults = useMemo(() => {
    let results = allEntries;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(entry => 
        (entry.title?.toLowerCase().includes(query) || 
         entry.content.toLowerCase().includes(query))
      );
    }

    // Mood filter
    if (selectedMood !== 'all') {
      results = results.filter(entry => entry.mood === selectedMood);
    }

    // Date range filter
    if (dateFrom) {
      results = results.filter(entry => 
        new Date(entry.entry_date) >= dateFrom
      );
    }
    if (dateTo) {
      results = results.filter(entry => 
        new Date(entry.entry_date) <= dateTo
      );
    }

    // Smart tag filter
    if (selectedTagType !== 'all' && selectedTag !== 'all') {
      results = results.filter(entry => 
        entry.smart_tags?.some(tag => 
          tag.tag_type === selectedTagType && tag.tag_value === selectedTag
        )
      );
    }

    return results;
  }, [allEntries, searchQuery, selectedMood, selectedTagType, selectedTag, dateFrom, dateTo]);

  const handleRegularSearch = () => {
    onResults(filteredResults);
  };

  // Auto-search as user types (debounced)
  useEffect(() => {
    if (!isNaturalLanguageMode) {
      const timer = setTimeout(() => {
        handleRegularSearch();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filteredResults, isNaturalLanguageMode]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMood('all');
    setSelectedTagType('all');
    setSelectedTag('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setIsNaturalLanguageMode(false);
    onResults(allEntries);
  };

  const detectNaturalLanguage = (query: string) => {
    const nlPatterns = [
      /show me.*entries/i,
      /find.*from/i,
      /entries.*about/i,
      /when i.*felt/i,
      /last (week|month|year)/i,
      /(happy|sad|angry|excited).*entries/i
    ];
    return nlPatterns.some(pattern => pattern.test(query));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsNaturalLanguageMode(detectNaturalLanguage(value));
  };

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={isNaturalLanguageMode ? 
                "Try: 'show me happy entries from last month'" : 
                "Search your journal entries..."
              }
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {isNaturalLanguageMode && (
            <Button 
              onClick={handleNaturalLanguageSearch}
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={clearFilters}
            size="icon"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Mood Filter */}
          <Select value={selectedMood} onValueChange={setSelectedMood}>
            <SelectTrigger>
              <SelectValue placeholder="Mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moods</SelectItem>
              <SelectItem value="happy">Happy</SelectItem>
              <SelectItem value="sad">Sad</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="excited">Excited</SelectItem>
              <SelectItem value="anxious">Anxious</SelectItem>
            </SelectContent>
          </Select>

          {/* Tag Type Filter */}
          <Select value={selectedTagType} onValueChange={(value) => {
            setSelectedTagType(value);
            setSelectedTag('all');
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Tag Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.keys(availableTags).map(tagType => (
                <SelectItem key={tagType} value={tagType}>
                  {tagType.charAt(0).toUpperCase() + tagType.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Specific Tag Filter */}
          <Select 
            value={selectedTag} 
            onValueChange={setSelectedTag}
            disabled={selectedTagType === 'all'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Specific Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {selectedTagType !== 'all' && availableTags[selectedTagType]?.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedMood !== 'all' || selectedTagType !== 'all' || dateFrom || dateTo) && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary">
                Text: {searchQuery}
              </Badge>
            )}
            {selectedMood !== 'all' && (
              <Badge variant="secondary">
                Mood: {selectedMood}
              </Badge>
            )}
            {selectedTagType !== 'all' && (
              <Badge variant="secondary">
                {selectedTagType}: {selectedTag !== 'all' ? selectedTag : 'any'}
              </Badge>
            )}
            {dateFrom && (
              <Badge variant="secondary">
                From: {format(dateFrom, "MMM dd, yyyy")}
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary">
                To: {format(dateTo, "MMM dd, yyyy")}
              </Badge>
            )}
          </div>
        )}

        {isNaturalLanguageMode && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            💡 Natural language detected! Click "Search" to use AI-powered search.
          </div>
        )}
      </div>
    </Card>
  );
};