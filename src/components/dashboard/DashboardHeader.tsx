import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Plus, BookOpen, LogOut, User, Mic, Target, BarChart3, 
  Search, Users, Brain, MessageCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onCreateNew: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  activeView, 
  onViewChange, 
  onCreateNew 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logged out", description: "You've been successfully logged out." });
      navigate('/');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const navItems = [
    { id: 'voice', icon: Mic, label: 'Voice' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'insights', icon: BarChart3, label: 'Mood' },
  ];

  const aiItems = [
    { id: 'ai-insights', icon: Brain, label: 'AI Insights' },
    { id: 'ai-chat', icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Daily Journal
              </span>
              <span className="hidden sm:block text-xs text-slate-400">Your personal growth companion</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {/* Create Button */}
            <Button
              onClick={onCreateNew}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 font-medium"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">New Entry</span>
            </Button>

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* Main Nav Items */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "transition-all font-medium",
                    activeView === item.id
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  )}
                >
                  <item.icon className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* AI Features */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-violet-100 to-purple-100 rounded-lg p-1">
              {aiItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "transition-all font-medium",
                    activeView === item.id
                      ? "bg-white shadow-sm text-violet-700"
                      : "text-violet-500 hover:text-violet-700 hover:bg-white/50"
                  )}
                >
                  <item.icon className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* Utility Buttons */}
            <Button
              onClick={() => onViewChange('search')}
              variant="ghost"
              size="sm"
              className={cn(
                "text-slate-500 hover:text-slate-700",
                activeView === 'search' && "bg-slate-100 text-slate-900"
              )}
            >
              <Search className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => navigate('/community')}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-700"
            >
              <Users className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => navigate('/profile')}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-700"
            >
              <User className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
