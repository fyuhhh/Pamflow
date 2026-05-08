import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const CustomDateRangePicker = ({ value, onChange, placeholder = 'Pilih rentang tanggal' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [tempRange, setTempRange] = useState({ start: value?.start, end: value?.end });
  const dropdownRef = useRef(null);

  useEffect(() => {
    setTempRange({ start: value?.start, end: value?.end });
  }, [value, isOpen]);

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
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (dateStr) => {
    if (!tempRange.start || (tempRange.start && tempRange.end)) {
      setTempRange({ start: dateStr, end: null });
    } else {
      const start = new Date(tempRange.start);
      const end = new Date(dateStr);
      if (end < start) {
        setTempRange({ start: dateStr, end: tempRange.start });
      } else {
        setTempRange({ ...tempRange, end: dateStr });
      }
    }
  };

  const isSelected = (dateStr) => dateStr === tempRange.start || dateStr === tempRange.end;
  const isInRange = (dateStr) => {
    if (!tempRange.start || !tempRange.end) return false;
    const d = new Date(dateStr);
    const s = new Date(tempRange.start);
    const e = new Date(tempRange.end);
    return d > s && d < e;
  };

  const renderCalendar = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square flex items-center justify-center"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const selected = isSelected(dateStr);
      const inRange = isInRange(dateStr);
      const isStart = dateStr === tempRange.start;
      const isEnd = dateStr === tempRange.end;

      days.push(
        <div 
          key={dateStr} 
          className={`aspect-square flex items-center justify-center relative ${inRange ? 'bg-[#F1FAFF]' : ''} ${isStart && tempRange.end ? 'rounded-l-full bg-[#F1FAFF]' : ''} ${isEnd ? 'rounded-r-full bg-[#F1FAFF]' : ''}`}
        >
          <div
            onClick={() => handleDateClick(dateStr)}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold cursor-pointer transition-all z-10
              ${selected ? 'bg-[#0095E8] text-white shadow-md scale-110' : 'text-[#3F4254] hover:bg-gray-100'}`}
          >
            {day}
          </div>
        </div>
      );
    }
    return days;
  };

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  const secondMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempRange({ start: null, end: null });
    onChange({ start: null, end: null });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#E4E6EF] rounded-lg cursor-pointer hover:border-[#0095E8] transition-colors shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-[13px] ${tempRange.start ? 'text-[#3F4254]' : 'text-[#A1A5B7]'}`}>
          {tempRange.start ? `${formatDate(tempRange.start)}${tempRange.end ? ` - ${formatDate(tempRange.end)}` : ''}` : placeholder}
        </span>
        <Calendar size={18} className="text-[#A1A5B7]" />
      </div>

      {isOpen && (
        <>
          {/* Backdrop for the calendar specifically to handle closing and isolation */}
          <div className="fixed inset-0 z-[250] bg-black/5" onClick={() => setIsOpen(false)}></div>
          
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[640px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-[#F1F1F4] z-[300] p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#3F4254]"><ChevronLeft size={20} /></button>
              <div className="flex gap-20 sm:gap-32 font-bold text-[#181C32] text-[15px]">
                <span className="min-w-[120px] text-center">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                <span className="min-w-[120px] text-center">{months[secondMonthDate.getMonth()]} {secondMonthDate.getFullYear()}</span>
              </div>
              <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#3F4254]"><ChevronRight size={20} /></button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 mb-6">
              {/* First Month */}
              <div className="flex-1">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {['Mi', 'Se', 'Se', 'Ra', 'Ka', 'Ju', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[11px] font-bold text-[#A1A5B7]">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {renderCalendar(viewDate.getFullYear(), viewDate.getMonth())}
                </div>
              </div>

              {/* Second Month */}
              <div className="flex-1">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {['Mi', 'Se', 'Se', 'Ra', 'Ka', 'Ju', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[11px] font-bold text-[#A1A5B7]">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {renderCalendar(secondMonthDate.getFullYear(), secondMonthDate.getMonth())}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#F1F1F4]">
              <div className="text-[14px] font-bold text-[#181C32] bg-[#F1FAFF] px-4 py-2 rounded-lg border border-[#D1E9FF]">
                {tempRange.start ? `${formatDate(tempRange.start)} - ${formatDate(tempRange.end) || '...'}` : 'Pilih rentang tanggal'}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="px-6 py-2 border border-[#E4E6EF] rounded-lg text-sm font-bold text-[#7E8299] hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleApply(); }}
                  disabled={!tempRange.start || !tempRange.end}
                  className="px-6 py-2 bg-[#0095E8] rounded-lg text-sm font-bold text-white hover:bg-[#0084CC] transition-colors disabled:opacity-50 shadow-sm"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomDateRangePicker;
