import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface CompactCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CompactCalendar: React.FC<CompactCalendarProps> = ({ selectedDate, onDateSelect }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-100">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        className="w-full border-0 p-0"
        classNames={{
          months: "flex w-full",
          month: "w-full",
          caption: "flex justify-center pt-1 relative items-center mb-3",
          caption_label: "text-sm font-semibold text-slate-700",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-7 w-7 bg-slate-100 hover:bg-slate-200 text-slate-600 p-0 border-0 rounded-lg transition-colors"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex w-full mb-1",
          head_cell: "text-slate-400 rounded-md w-full font-medium text-[0.7rem] flex-1 text-center uppercase",
          row: "flex w-full mt-1",
          cell: "text-center text-sm p-0 relative flex-1 h-8",
          day: cn(
            "h-8 w-full p-0 font-normal text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-all duration-200"
          ),
          day_selected: "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white font-semibold shadow-md",
          day_today: "bg-orange-100 text-orange-700 font-bold",
          day_outside: "text-slate-300 opacity-50",
          day_disabled: "text-slate-200 opacity-50",
          day_hidden: "invisible",
        }}
      />
    </div>
  );
};

export default CompactCalendar;
