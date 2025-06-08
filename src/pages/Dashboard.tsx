
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BookOpen, LogOut } from 'lucide-react';
import JournalEditor from '@/components/JournalEditor';
import JournalList from '@/components/JournalList';
import CalendarSidebar from '@/components/CalendarSidebar';
import TodoSidebar from '@/components/TodoSidebar';
import UnfinishedTasks from '@/components/UnfinishedTasks';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong while logging out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-600 via-gray-600 to-stone-600 shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-white drop-shadow-md" />
              <h1 className="text-2xl font-bold text-white drop-shadow-md">Daily Journal</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unfinished Tasks Section */}
        <div className="mb-6">
          <UnfinishedTasks />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Left Sidebar - Calendar */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <CalendarSidebar 
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              <TodoSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
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
