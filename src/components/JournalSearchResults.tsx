import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Tag, User, MapPin, Activity } from "lucide-react";
import { format } from "date-fns";

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

interface JournalSearchResultsProps {
  results: Journal[];
  onSelectJournal: (journal: Journal) => void;
  searchQuery?: string;
}

export const JournalSearchResults: React.FC<JournalSearchResultsProps> = ({ 
  results, 
  onSelectJournal,
  searchQuery 
}) => {
  const getTagIcon = (tagType: string) => {
    switch (tagType) {
      case 'people': return <User className="w-3 h-3" />;
      case 'locations': return <MapPin className="w-3 h-3" />;
      case 'activities': return <Activity className="w-3 h-3" />;
      default: return <Tag className="w-3 h-3" />;
    }
  };

  const getTagColor = (tagType: string) => {
    switch (tagType) {
      case 'mood': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'topics': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'people': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'activities': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'locations': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const highlightSearchTerm = (text: string, query?: string) => {
    if (!query || query.trim() === '') return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getMoodColor = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return 'text-green-600 dark:text-green-400';
      case 'excited': return 'text-orange-600 dark:text-orange-400';
      case 'sad': return 'text-blue-600 dark:text-blue-400';
      case 'anxious': return 'text-red-600 dark:text-red-400';
      case 'neutral': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium mb-2">No entries found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search terms or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {results.length} {results.length === 1 ? 'entry' : 'entries'} found
        </h2>
      </div>

      <div className="grid gap-4">
        {results.map((journal) => (
          <Card 
            key={journal.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectJournal(journal)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-base mb-1">
                    {journal.title ? (
                      highlightSearchTerm(journal.title, searchQuery)
                    ) : (
                      <span className="text-muted-foreground italic">Untitled Entry</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(journal.entry_date), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(journal.created_at), 'h:mm a')}
                    </div>
                    {journal.mood && (
                      <span className={`font-medium ${getMoodColor(journal.mood)}`}>
                        {journal.mood}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="mb-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {highlightSearchTerm(journal.content.substring(0, 200) + '...', searchQuery)}
                </p>
              </div>

              {/* Smart Tags */}
              {journal.smart_tags && journal.smart_tags.length > 0 && (
                <div className="space-y-2">
                  {Object.entries(
                    journal.smart_tags.reduce((acc, tag) => {
                      if (!acc[tag.tag_type]) acc[tag.tag_type] = [];
                      acc[tag.tag_type].push(tag);
                      return acc;
                    }, {} as Record<string, typeof journal.smart_tags>)
                  ).map(([tagType, tags]) => (
                    <div key={tagType} className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getTagIcon(tagType)}
                        <span className="capitalize font-medium">{tagType}:</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {tags.slice(0, 4).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className={`text-xs ${getTagColor(tag.tag_type)}`}
                          >
                            {tag.tag_value}
                          </Badge>
                        ))}
                        {tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{tags.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectJournal(journal);
                  }}
                >
                  View Full Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};