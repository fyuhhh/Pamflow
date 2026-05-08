import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * A premium searchable dropdown component
 */
const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Pilih...", 
  labelField = "name", 
  valueField = "id",
  disabled = false,
  className = "",
  name = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt[valueField]) === String(value));
  
  const filteredOptions = options.filter(opt => 
    String(opt[labelField] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (opt) => {
    // Mimic standard event object for compatibility with existing handleChange functions
    onChange({ 
      target: { 
        name, 
        value: opt[valueField],
        type: 'select'
      } 
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border ${isOpen ? 'border-[#0095E8] ring-1 ring-[#0095E8]/20' : 'border-[#F1F1F4]'} rounded-lg text-sm transition-all cursor-pointer ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-70' : ''}`}
      >
        <span className={`truncate mr-2 ${selectedOption ? 'text-[#3F4254] font-medium' : 'text-[#A1A5B7]'}`}>
          {selectedOption ? selectedOption[labelField] : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {selectedOption && !disabled && (
            <X 
              size={14} 
              className="text-[#A1A5B7] hover:text-[#F1416C] transition-colors" 
              onClick={(e) => {
                e.stopPropagation();
                handleSelect({ [valueField]: '' });
              }}
            />
          )}
          <ChevronDown size={16} className={`text-[#A1A5B7] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#F1F1F4] rounded-lg shadow-xl z-[100] overflow-hidden"
          style={{ animation: 'selectFadeIn 0.2s ease-out forwards' }}
        >
          <div className="p-3 border-b border-[#F1F1F4] sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={14} />
              <input
                autoFocus
                type="text"
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F9F9F9] border border-[#F1F1F4] rounded-md text-xs focus:outline-none focus:border-[#0095E8] transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div
                  key={opt[valueField] || i}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${String(opt[valueField]) === String(value) ? 'bg-[#F1FAFF] text-[#0095E8] font-bold' : 'text-[#3F4254] hover:bg-[#F9F9F9]'}`}
                >
                  {opt[labelField]}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-xs text-[#A1A5B7] text-center italic">
                Tidak ada data ditemukan
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes selectFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e6ef;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a5b7;
        }
      `}</style>
    </div>
  );
};

export default SearchableSelect;
