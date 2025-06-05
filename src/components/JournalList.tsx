
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

interface JournalListProps {
  selectedDate: Date;
  onEditJournal: (journal: any) => void;
}

// Mock data - replace with real data from Supabase
const mockJournals = [
  {
    id: 1,
    date: new Date(),
    content: "Today was a productive day. I managed to complete several tasks and felt really good about my progress. The weather was perfect for a morning walk, which helped clear my mind before starting work.",
    todos: [
      { id: 1, task: "Review project proposal", completed: true },
      { id: 2, task: "Call mom", completed: false },
      { id: 3, task: "Go for a run", completed: true },
    ],
    created_at: new Date(),
  },
  {
    id: 2,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    content: "Had some challenges today but managed to work through them. Learned something new about React hooks which was exciting.",
    todos: [
      { id: 4, task: "Study React documentation", completed: true },
      { id: 5, task: "Prepare presentation", completed: false },
    ],
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const JournalList = ({ selectedDate, onEditJournal }: JournalListProps) => {
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getPreview = (content: string, maxLength: number = 150) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  const completedTodos = (todos: any[]) => {
    return todos.filter(todo => todo.completed).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Journal Entries
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          {formatDate(selectedDate)}
        </div>
      </div>

      {mockJournals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500 mb-4">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No entries found</h3>
              <p>Start your journaling journey by creating your first entry.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockJournals.map((journal) => (
            <Card key={journal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {formatDate(journal.date)}
                  </CardTitle>
                  <Button
                    onClick={() => onEditJournal(journal)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {getPreview(journal.content)}
                </p>
                
                {journal.todos && journal.todos.length > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      <span>
                        {completedTodos(journal.todos)} of {journal.todos.length} tasks completed
                      </span>
                    </div>
                    
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {journal.todos.length} {journal.todos.length === 1 ? 'task' : 'tasks'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalList;
