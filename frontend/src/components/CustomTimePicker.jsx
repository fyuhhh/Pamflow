import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

const CustomTimePicker = ({ value, onChange, placeholder = 'Pilih waktu', hasError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse initial hours and minutes from string "HH:mm"
  const parseTime = (timeStr) => {
    if (!timeStr) return { h: 10, m: 36 }; // default matching screenshot
    const [h, m] = timeStr.split(':').map(Number);
    return { h: isNaN(h) ? 10 : h, m: isNaN(m) ? 36 : m };
  };

  const initialTime = parseTime(value);
  const [hours, setHours] = useState(initialTime.h);
  const [minutes, setMinutes] = useState(initialTime.m);

  // Sync state upward when it changes
  useEffect(() => {
    if (value !== undefined && isOpen) {
       // Only fire onChange if we're actively manipulating it so we don't cause infinite loops
       const newTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
       onChange(newTime);
    }
  }, [hours, minutes]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHourUp = (e) => {
    e.stopPropagation();
    setHours((h) => (h === 23 ? 0 : h + 1));
  };

  const handleHourDown = (e) => {
    e.stopPropagation();
    setHours((h) => (h === 0 ? 23 : h - 1));
  };

  const handleMinuteUp = (e) => {
    e.stopPropagation();
    setMinutes((m) => (m === 59 ? 0 : m + 1));
  };

  const handleMinuteDown = (e) => {
    e.stopPropagation();
    setMinutes((m) => (m === 0 ? 59 : m - 1));
  };

  const displayValue = value || placeholder;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg cursor-pointer transition-colors ${hasError ? 'border-[#F1416C]' : 'border-[#E4E6EF] hover:border-[#0095E8]'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm ${value ? 'text-[#3F4254]' : 'text-[#A1A5B7]'}`}>
          {displayValue}
        </span>
        <Clock size={18} className="text-[#A1A5B7]" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 bg-white rounded-xl shadow-lg border border-[#F1F1F4] z-50 p-4 min-w-[140px] flex justify-center">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-[#F1F1F4] transform rotate-45"></div>
          
          <div className="flex items-center gap-4 relative z-10 select-none">
            {/* Hours */}
            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={handleHourUp} className="p-1 hover:bg-gray-100 rounded text-[#3F4254]"><ChevronUp size={16}/></button>
              <div className="text-sm font-semibold text-[#3F4254] w-6 text-center">{String(hours).padStart(2, '0')}</div>
              <button type="button" onClick={handleHourDown} className="p-1 hover:bg-gray-100 rounded text-[#3F4254]"><ChevronDown size={16}/></button>
            </div>
            
            {/* Separator */}
            <div className="text-sm font-bold text-[#3F4254] mb-1">:</div>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={handleMinuteUp} className="p-1 hover:bg-gray-100 rounded text-[#3F4254]"><ChevronUp size={16}/></button>
              <div className="text-sm font-semibold text-[#3F4254] w-6 text-center">{String(minutes).padStart(2, '0')}</div>
              <button type="button" onClick={handleMinuteDown} className="p-1 hover:bg-gray-100 rounded text-[#3F4254]"><ChevronDown size={16}/></button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CustomTimePicker;
