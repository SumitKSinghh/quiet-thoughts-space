
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CalendarSidebar = ({ selectedDate, onDateSelect }: CalendarSidebarProps) => {
  const [showCalendar, setShowCalendar] = useState(true);

  const quickDateOptions = [
    { label: 'Today', date: new Date() },
    { label: 'Yesterday', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { label: 'This Week', date: new Date() },
    { label: 'This Month', date: new Date() },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Date Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickDateOptions.map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left",
                "hover:bg-blue-50 hover:text-blue-700"
              )}
              onClick={() => onDateSelect(option.date)}
            >
              {option.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle 
            className="text-lg flex items-center justify-between cursor-pointer"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <span className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
              Calendar
            </span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform",
                showCalendar ? "rotate-180" : ""
              )}
            />
          </CardTitle>
        </CardHeader>
        
        {showCalendar && (
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateSelect(date)}
              className={cn("p-3 pointer-events-auto")}
              classNames={{
                day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                day_today: "bg-blue-100 text-blue-900 font-semibold",
              }}
            />
          </CardContent>
        )}
      </Card>

      {/* Journal Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Entries this month</span>
            <span className="font-semibold text-blue-600">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current streak</span>
            <span className="font-semibold text-green-600">5 days</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total entries</span>
            <span className="font-semibold text-gray-900">47</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarSidebar;
