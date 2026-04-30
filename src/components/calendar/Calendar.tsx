import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';

interface CalendarProps {
  onSelect: (date: Date | undefined) => void;
  selectedDate: Date | undefined;
}

export const Calendar: React.FC<CalendarProps> = ({ onSelect, selectedDate }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 p-2 text-[10px] text-slate-200">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        className="text-slate-200"
        classNames={{
          caption: "flex justify-between py-1 mb-2 font-mono text-cyan-400",
          nav_button: "hover:bg-slate-800",
          table: "w-full border-collapse",
          head_row: "flex justify-between mb-1",
          head_cell: "text-slate-500 font-normal w-6 text-center",
          row: "flex justify-between mb-0.5",
          cell: "w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-slate-800",
          day: "w-full h-full flex items-center justify-center",
          day_selected: "bg-cyan-600 text-white font-bold",
          day_today: "border border-cyan-800",
        }}
      />
      <div className="mt-2 pt-1 border-t border-slate-800 text-[9px] text-slate-500">
        Selecionado: {selectedDate ? format(selectedDate, 'PPP') : 'Nenhum'}
      </div>
    </div>
  );
};
