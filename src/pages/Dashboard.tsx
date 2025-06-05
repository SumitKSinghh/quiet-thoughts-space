
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BookOpen, LogOut } from 'lucide-react';
import JournalEditor from '@/components/JournalEditor';
import JournalList from '@/components/JournalList';
import CalendarSidebar from '@/components/CalendarSidebar';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedJournal, setSelectedJournal] = useState<any>(null);

  const handleCreateNew = () => {
    setSelectedJournal(null);
    setActiveView('create');
  };

  const handleEditJournal = (journal: any) => {
    setSelectedJournal(journal);
    setActiveView('edit');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedJournal(null);
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logging out...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Daily Journal</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CalendarSidebar 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeView === 'list' && (
              <JournalList
                selectedDate={selectedDate}
                onEditJournal={handleEditJournal}
              />
            )}
            
            {(activeView === 'create' || activeView === 'edit') && (
              <JournalEditor
                journal={selectedJournal}
                selectedDate={selectedDate}
                onBack={handleBackToList}
                onSave={handleBackToList}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
