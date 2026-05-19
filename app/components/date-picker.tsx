'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // expects DD/MM/YYYY
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function DatePicker({ value, onChange, label, required }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse DD/MM/YYYY to Date object
  useEffect(() => {
    if (value && value.length === 10) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts.map(Number);
        const parsed = new Date(y, m - 1, d);
        if (!isNaN(parsed.getTime())) {
          setCurrentDate(parsed);
        }
      }
    }
  }, [value]);

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get number of days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get starting day of the week (0-6)
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const dStr = day.toString().padStart(2, '0');
    const mStr = (month + 1).toString().padStart(2, '0');
    onChange(`${dStr}/${mStr}/${year}`);
    setIsOpen(false);
  };

  // Keyboard typing input mask handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length > 4) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length > 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    onChange(val);
  };

  // Build grid items
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const gridItems = [...blanks, ...days];

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white pl-4 pr-10 py-2.5 text-sm focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white transition-colors";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className={labelClass}>{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="DD/MM/AAAA"
          required={required}
          className={inputClass}
          onClick={() => setIsOpen(true)}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <CalendarIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Popover Calendar Grid */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 transition-all">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {MONTHS[month]} de {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((day, idx) => (
              <span key={idx} className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {gridItems.map((item, idx) => {
              if (item === null) {
                return <span key={`blank-${idx}`} className="py-2"></span>;
              }

              const isSelected = value === `${item.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;

              return (
                <button
                  key={`day-${item}`}
                  type="button"
                  onClick={() => handleSelectDay(item)}
                  className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
