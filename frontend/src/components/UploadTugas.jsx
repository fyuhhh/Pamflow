import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Upload, ChevronLeft, FileUp } from 'lucide-react';

const UploadTugas = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-8">
      {/* Container Card */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden min-h-[500px] flex flex-col">
        {/* Main Content Area */}
        <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Download Template */}
          <div className="p-8 rounded-xl border border-[#F1F1F4] bg-white">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0095E8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#181C32] mb-1 flex items-center gap-2">
                  Download Template
                  <Info size={16} className="text-[#0095E8]" />
                </h3>
                <p className="text-[13px] text-[#7E8299] leading-relaxed">
                  Anda harus download template terlebih dahulu sebelum upload tugas secara massal.
                </p>
                <p className="text-[13px] text-[#7E8299] mt-4">
                  Maksimum 50 baris data dalam sekali upload.
                </p>
              </div>
            </div>
            
            <div className="mt-10">
              <button 
                className="px-6 py-2.5 bg-white border border-[#0095E8] rounded-lg text-sm font-bold text-[#0095E8] hover:bg-blue-50 transition-colors"
              >
                Download Template
              </button>
            </div>
          </div>

          {/* Right Column: Upload Template */}
          <div className="p-8 rounded-xl border border-[#F1F1F4] bg-white">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#0095E8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#181C32] mb-1 flex items-center gap-2">
                  Upload Template
                  <Upload size={16} className="text-[#0095E8]" />
                </h3>
                <p className="text-[13px] text-[#7E8299]">
                  Pilih atau letakkan file excel (.xls atau .xlsx) ke sini.
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <div 
              className={`mt-6 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200 ${
                dragActive ? 'border-[#0095E8] bg-[#F1FAFF]' : 'border-[#E4E6EF] bg-[#F9F9F9]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-[#F1F1F4] flex items-center justify-center mb-6">
                <FileUp size={32} className="text-[#0095E8]" />
              </div>
              
              <p className="text-sm text-[#3F4254] mb-4">
                {selectedFile ? selectedFile.name : 'Belum ada file terpilih'}
              </p>

              <label className="cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xls,.xlsx" 
                  onChange={handleFileChange}
                />
                <div className="px-6 py-2 bg-white border border-[#E4E6EF] rounded-lg text-xs font-bold text-[#0095E8] hover:bg-white shadow-sm transition-all hover:shadow-md">
                  Pilih File
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="p-8 border-t border-[#F1F1F4] flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="px-8 py-2.5 bg-white border border-[#0095E8] rounded-lg text-sm font-bold text-[#0095E8] hover:bg-blue-50 transition-colors"
          >
            Batal
          </button>
          <button 
            type="button" 
            disabled={!selectedFile}
            className={`px-8 py-2.5 rounded-lg text-sm font-bold text-white transition-colors ${
              selectedFile ? 'bg-[#0095E8] hover:bg-[#0084CC]' : 'bg-[#ACE2FF] cursor-not-allowed'
            }`}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadTugas;
