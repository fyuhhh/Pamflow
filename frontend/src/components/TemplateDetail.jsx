import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Edit2, Download, Circle } from 'lucide-react';
import { authFetch } from '../services/api';

const TemplateDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const response = await authFetch(`/api/templates/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
      }
    } catch (err) {
      console.error('Error fetching template:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#7E8299] text-sm">Memuat data...</div>;
  }

  if (!template) {
    return <div className="p-8 text-center text-[#7E8299] text-sm">Template tidak ditemukan.</div>;
  }

  return (
    <div className="p-8 px-10 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pengaturan/template-tugas')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E4E6EF] text-[#7E8299] hover:bg-gray-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-[17px] font-bold text-[#181C32]">Detail Template</h2>
        </div>
        <div className="flex gap-3">
          <button
             onClick={() => navigate(`/pengaturan/template-tugas/edit/${id}`)}
             className="px-6 py-2.5 bg-white border border-[#E4E6EF] text-[#3F4254] rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            Edit Template
          </button>
          <button
            className="px-6 py-2.5 bg-white border border-[#0092E4] text-[#0092E4] rounded-lg text-[13px] font-bold hover:bg-blue-50 transition-all shadow-sm"
          >
            Download Laporan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#F1F1F4] shadow-sm overflow-hidden">
        {/* Basic Info Section (Grid 1 Column in Image? No, let's use 1 to match Image 2's vertical Stack) */}
        <div className="p-8 space-y-8">
           <div className="flex flex-col gap-1.5">
             <span className="text-[13px] text-[#7E8299]">Perusahaan</span>
             <span className="text-[14px] font-bold text-[#3F4254]">{template.company_name}</span>
           </div>
           
           <div className="flex flex-col gap-1.5">
             <span className="text-[13px] text-[#7E8299]">Departemen</span>
             <span className="text-[14px] font-bold text-[#3F4254]">{template.department_name}</span>
           </div>

           <div className="flex flex-col gap-1.5">
             <span className="text-[13px] text-[#7E8299]">Nama template</span>
             <span className="text-[14px] font-bold text-[#3F4254]">{template.name}</span>
           </div>
           
           <div className="flex flex-col gap-1.5">
             <span className="text-[13px] text-[#7E8299]">Jenis template</span>
             <span className="text-[14px] font-bold text-[#3F4254] uppercase">{template.jenis_template || 'checklist'}</span>
           </div>
        </div>

        {/* Detail Tugas List */}
        <div className="bg-white space-y-8 pb-8">
           {Array.isArray(template.details) && template.details.map((detail, index) => (
             <div key={detail.id} className="px-8 space-y-6">
                <h3 className="text-[14px] font-bold text-[#181C32]">Detail Tugas {index + 1}</h3>
                
                <div className="space-y-6 pl-0">
                  <div className="flex flex-col gap-1.5">
                     <span className="text-[13px] text-[#7E8299]">Nama detail tugas</span>
                     <span className="text-[14px] font-bold text-[#3F4254]">{index + 1}. {detail.nama_detail}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                     <span className="text-[13px] text-[#7E8299]">Bentuk laporan</span>
                     <span className="text-[14px] font-bold text-[#3F4254]">{detail.bentuk_laporan}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                     <span className="text-[13px] text-[#7E8299]">Deskripsi</span>
                     <span className="text-[14px] text-[#3F4254] leading-relaxed">{detail.deskripsi || '-'}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                     <span className="text-[13px] text-[#7E8299]">Ketentuan Pengisian</span>
                     <span className="text-[14px] font-bold text-[#3F4254]">Wajib diisi</span>
                  </div>

                  {/* Options Manager Visualization if needed */}
                  {(detail.bentuk_laporan === 'Multiple Choice' || detail.bentuk_laporan === 'Dropdown') && detail.options && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                       {detail.options.map((opt, i) => (
                         <div key={i} className="flex items-center gap-3 bg-[#F9F9F9] px-4 py-3 rounded-lg border border-[#E4E6EF]">
                            <Circle size={12} className="text-[#A1A5B7]" />
                            <span className="text-sm text-[#3F4254]">{opt}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;
