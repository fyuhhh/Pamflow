import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomDatePicker = ({ value, onChange, placeholder = 'Pilih tanggal', hasError, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const dropdownRef = useRef(null);

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

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Check if date is before minDate
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      const target = new Date(newDate);
      target.setHours(0, 0, 0, 0);
      if (target < min) return;
    }

    // Format to YYYY-MM-DD
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    const days = [];
    const selectedDate = value ? new Date(value) : null;
    const minD = minDate ? new Date(minDate) : null;
    if (minD) minD.setHours(0,0,0,0);

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="text-center p-2 text-sm text-[#E4E6EF]">
          {daysInPrevMonth - i}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dObj = new Date(year, month, day);
      const isSelected = selectedDate && 
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === day;
      
      const isDisabled = minD && dObj < minD;

      days.push(
        <div key={`current-${day}`} className="flex justify-center items-center h-8">
          <div 
            onClick={() => !isDisabled && handleDateClick(day)}
            className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors
              ${isDisabled ? 'text-[#E4E6EF] cursor-not-allowed' : 'cursor-pointer'}
              ${isSelected ? 'bg-[#EEF6F9] text-[#181C32]' : !isDisabled ? 'text-[#3F4254] hover:bg-gray-100' : ''}`}
          >
            {day}
          </div>
        </div>
      );
    }

    // Next month leading days (fill up to 42 slots for consistent height)
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
        days.push(
          <div key={`next-${i}`} className="text-center p-2 text-sm text-[#E4E6EF]">
            {i}
          </div>
        );
    }

    return days;
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Format for display input "15/04/2026" or similar if needed, but let's stick to simple display or YYYY-MM-DD
  let displayValue = "";
  if (value) {
      const d = new Date(value);
      displayValue = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg cursor-pointer transition-colors ${hasError ? 'border-[#F1416C]' : 'border-[#E4E6EF] hover:border-[#0095E8]'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm ${displayValue ? 'text-[#3F4254]' : 'text-[#A1A5B7]'}`}>
          {displayValue || placeholder}
        </span>
        <Calendar size={18} className="text-[#A1A5B7]" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-xl shadow-lg border border-[#F1F1F4] z-50 p-4">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-[#F1F1F4] transform rotate-45"></div>
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4 relative z-10">
             <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded text-[#3F4254]"><ChevronLeft size={16} /></button>
             <div className="text-sm font-bold text-[#181C32]">
                {months[currentDate.getMonth()]} &nbsp; {currentDate.getFullYear()}
             </div>
             <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded text-[#3F4254]"><ChevronRight size={16} /></button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2 relative z-10">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-[#181C32]">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-y-1 relative z-10">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
