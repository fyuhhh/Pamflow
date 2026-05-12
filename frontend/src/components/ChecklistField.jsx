import React, { useRef } from 'react';
import { Camera, X, Check, CheckCircle2, XCircle } from 'lucide-react';
import { compressImage } from '../utils/imageOptimizer';

const ChecklistField = ({ field, value, status, onValueChange, onStatusChange, notes, onNotesChange, photoUrls, onPhotoChange }) => {
  const fileInputRef = useRef(null);
  const reportType = field.type || field.bentuk_laporan;
  const fieldLabel = field.name || field.nama_detail;
  const isRequired = field.required || field.wajib_diisi;
  const options = field.options || [];

  const handleFileChange = async (e, isMultiple = false) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        const compressedImages = await Promise.all(
          files.map(file => compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.6 }))
        );
        
        const dataUrls = await Promise.all(
          compressedImages.map(blob => new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
          }))
        );
        
        if (isMultiple) {
          const currentValues = Array.isArray(value) ? value : [];
          onValueChange([...currentValues, ...dataUrls].slice(0, 5));
        } else {
          onValueChange(dataUrls[0]);
        }
      } catch (error) {
        console.error('Image upload error:', error);
      }
    }
  };

  const renderInput = () => {
    switch (reportType) {
      case 'Text Field':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={`Masukkan ${fieldLabel}`}
            className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E4E6EF] rounded-xl focus:outline-none focus:border-[#0095E8] text-[13px] transition-all"
          />
        );
      case 'Dropdown':
        return (
          <div className="relative">
            <select
              value={value || ''}
              onChange={(e) => onValueChange(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E4E6EF] rounded-xl focus:outline-none focus:border-[#0095E8] text-[13px] appearance-none cursor-pointer"
            >
              <option value="">Pilih Opsi</option>
              {options.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A1A5B7]">
              <Check size={16} className="rotate-90" />
            </div>
          </div>
        );
      case 'Multiple Choice':
        return (
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => {
              const isSelected = Array.isArray(value) ? value.includes(opt) : value === opt;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
                    const newValues = currentValues.includes(opt)
                      ? currentValues.filter(v => v !== opt)
                      : [...currentValues, opt];
                    onValueChange(newValues);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected ? 'bg-[#F1FAFF] border-[#0095E8] text-[#0095E8]' : 'bg-white border-[#E4E6EF] text-[#3F4254]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#0095E8] border-[#0095E8]' : 'border-[#E4E6EF]'}`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-[12px] font-semibold">{opt}</span>
                </button>
              );
            })}
          </div>
        );
      case 'Image':
        return (
          <div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileChange(e, false)} className="hidden" />
            {value ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#E4E6EF]">
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => onValueChange('')} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current.click()} className="w-full py-8 border-2 border-dashed border-[#E4E6EF] rounded-xl flex flex-col items-center justify-center gap-2 bg-[#F9F9F9] hover:bg-[#F1FAFF] transition-all">
                <Camera size={24} className="text-[#A1A5B7]" />
                <span className="text-[12px] font-bold text-[#0095E8]">Ambil Foto / Unggah</span>
              </button>
            )}
          </div>
        );
      case 'Multiple Images':
        return (
          <div className="grid grid-cols-3 gap-3">
            {Array.isArray(value) && value.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#E4E6EF]">
                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                <button type="button" onClick={() => onValueChange(value.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full">
                  <X size={10} />
                </button>
              </div>
            ))}
            {(!Array.isArray(value) || value.length < 5) && (
              <button type="button" onClick={() => fileInputRef.current.click()} className="aspect-square border-2 border-dashed border-[#E4E6EF] rounded-xl flex items-center justify-center bg-[#F9F9F9] hover:bg-[#F1FAFF]">
                <Camera size={20} className="text-[#A1A5B7]" />
                <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={(e) => handleFileChange(e, true)} className="hidden" />
              </button>
            )}
          </div>
        );
      case 'Date':
      case 'Time':
        return (
          <input
            type={reportType.toLowerCase()}
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-4 py-3 bg-[#F9F9F9] border border-[#E4E6EF] rounded-xl focus:outline-none focus:border-[#0095E8] text-[13px]"
          />
        );
      default:
        return <p className="text-[12px] text-gray-400 italic">Tipe field tidak didukung: {reportType}</p>;
    }
  };

  return (
    <div className={`p-4 md:p-6 bg-white border border-[#F1F1F4] rounded-2xl shadow-sm transition-all ${status === 'rusak' ? 'border-[#F1416C]/30 bg-[#FFF5F8]/30' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Input Side */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-bold text-[#181C32]">
              {fieldLabel} {isRequired && <span className="text-[#F1416C]">*</span>}
            </label>
          </div>
          {renderInput()}
          {status === 'rusak' && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notes || ''}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Catatan kerusakan..."
                  className="flex-1 px-4 py-3 bg-white border border-[#F1416C]/30 rounded-xl text-[13px] focus:border-[#F1416C] outline-none transition-colors"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0 && onPhotoChange) {
                        try {
                          const currentUrls = photoUrls || [];
                          const compressedPromises = files.map(file => compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.6 }));
                          const compressedBlobs = await Promise.all(compressedPromises);
                          
                          const newUrls = await Promise.all(compressedBlobs.map(blob => new Promise(resolve => {
                            const reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = () => resolve(reader.result);
                          })));
                          
                          onPhotoChange([...currentUrls, ...newUrls].slice(0, 5)); // max 5 photos
                        } catch (err) {
                          console.error('Photo error:', err);
                        }
                      }
                    }}
                    className="hidden"
                    id={`rusak-photo-${field.id || fieldLabel}`}
                  />
                  <label
                    htmlFor={`rusak-photo-${field.id || fieldLabel}`}
                    className="flex items-center justify-center w-[46px] h-[46px] rounded-xl bg-white border border-[#F1416C]/30 text-[#F1416C] hover:bg-[#FFF5F8] cursor-pointer transition-colors shadow-sm"
                    title="Lampirkan foto kerusakan (max 5)"
                  >
                    <Camera size={20} />
                  </label>
                </div>
              </div>
              {photoUrls && photoUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {photoUrls.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#F1416C]/20 bg-white shadow-sm">
                      <img src={url} className="w-full h-full object-cover" alt={`Foto kerusakan ${idx + 1}`} />
                      <button 
                        type="button" 
                        onClick={() => {
                          const newUrls = photoUrls.filter((_, i) => i !== idx);
                          onPhotoChange(newUrls);
                        }} 
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Toggle Side */}
        <div className="flex flex-row md:flex-col gap-2 shrink-0 md:pt-8">
          <button
            type="button"
            onClick={() => onStatusChange('ok')}
            className={`flex-1 md:w-32 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all border ${
              status === 'ok' 
                ? 'bg-[#E8FFF3] border-[#50CD89] text-[#50CD89]' 
                : 'bg-white border-[#E4E6EF] text-[#7E8299] hover:border-[#50CD89] hover:text-[#50CD89]'
            }`}
          >
            <CheckCircle2 size={16} /> Baik
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('rusak')}
            className={`flex-1 md:w-32 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all border ${
              status === 'rusak' 
                ? 'bg-[#FFF5F8] border-[#F1416C] text-[#F1416C]' 
                : 'bg-white border-[#E4E6EF] text-[#7E8299] hover:border-[#F1416C] hover:text-[#F1416C]'
            }`}
          >
            <XCircle size={16} /> Rusak
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistField;
