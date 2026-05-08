import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { authFetch } from '../services/api';

const DepartemenDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  const fetchDepartment = async () => {
    try {
      const response = await authFetch(`/api/departments/${id}`);
      const data = await response.json();
      setDepartment(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching department details:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-[#A1A5B7]">Memuat...</div>;
  if (!department) return <div className="p-10 text-center text-red-500">Departemen tidak ditemukan.</div>;

  const detailFields = [
    { label: 'Nama departemen', value: department.name },
    { label: 'ID departemen', value: department.dept_id },
    { label: 'Perusahaan', value: department.company_name },
    { label: 'Organisasi', value: department.company_name }, // Using company_name as placeholder for organization
    { label: 'Nomor telepon', value: `+62 ${department.phone}` },
    { label: 'Nomor WhatsApp', value: `+62 ${department.whatsapp}` },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/pengaturan/departemen')}
          className="p-2 hover:bg-[#F1F1F4] rounded-lg transition-colors"
        >
          <ChevronLeft size={24} className="text-[#A1A5B7]" />
        </button>
        <h1 className="text-[20px] font-bold text-[#181C32]">Detail Departemen</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#F1F1F4] shadow-sm overflow-hidden">
        {/* Back Link */}
        <div className="p-6 border-b border-[#F1F1F4]">
          <button 
            onClick={() => navigate('/pengaturan/departemen')}
            className="flex items-center gap-2 text-[#0095E8] text-[13px] font-medium hover:underline"
          >
            <ArrowLeft size={16} />
            Kembali ke daftar Departemen
          </button>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-20">
            {detailFields.map((field, index) => (
              <div key={index} className="flex justify-between items-start border-b border-dashed border-[#F1F1F4] pb-4">
                <span className="text-[13px] text-[#A1A5B7]">{field.label}</span>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[13px] text-[#3F4254] font-medium text-right max-w-[200px]">
                    {field.value || '-'}
                  </span>
                  {field.label === detailFields[0].label && (
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      department.status === 'Aktif' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600 outline outline-1 outline-red-100'
                    }`}>
                      {department.status === 'Aktif' ? 'Aktif' : 'Tidak aktif'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default DepartemenDetail;
