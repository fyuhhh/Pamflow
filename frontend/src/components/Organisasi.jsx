import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Building2, User, LayoutGrid } from 'lucide-react';
import { authFetch } from '../services/api';

const Organisasi = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      const response = await authFetch(`/api/organization/${user?.orgId || 'PAM'}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // Ensure numeric values for quota to avoid NaN
      const total = result.totalQuota || 100;
      const used = result.usedQuota || 0;
      
      setData({
        ...result,
        totalQuota: total,
        usedQuota: used
      });
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setData({ error: true, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0095E8]"></div>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-[#F1416C] font-bold text-lg">Gagal memuat data organisasi</div>
        <div className="text-[#7E8299] text-[13px]">{data.message}</div>
        <button 
          onClick={fetchOrgData}
          className="px-6 py-2 bg-[#0095E8] text-white rounded-lg text-[13px] font-bold"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!data?.orgId) return <div className="p-8 text-center text-[#7E8299]">Data organisasi tidak ditemukan.</div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F1F1F4] rounded-lg transition-colors"
        >
          <ChevronLeft size={24} className="text-[#A1A5B7]" />
        </button>
        <h1 className="text-[20px] font-bold text-[#181C32]">Organisasi</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#F1F1F4] shadow-sm overflow-hidden">
        <div className="p-10 space-y-12">
          
          {/* Informasi Organisasi */}
          <section>
            <h2 className="text-[15px] font-bold text-[#181C32] mb-6">Informasi Organisasi</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-[250px_1fr] items-center">
                <span className="text-[13px] text-[#7E8299]">Nama organisasi</span>
                <span className="text-[13px] font-medium text-[#3F4254]">{data.name}</span>
              </div>
              <div className="grid grid-cols-[250px_1fr] items-center">
                <span className="text-[13px] text-[#7E8299]">ID organisasi</span>
                <span className="text-[13px] font-medium text-[#3F4254]">{data.orgId}</span>
              </div>
              <div className="grid grid-cols-[250px_1fr] items-center">
                <span className="text-[13px] text-[#7E8299]">Logo organisasi</span>
                <span className="text-[13px] font-medium text-[#3F4254]">{data.logo || '-'}</span>
              </div>
            </div>
          </section>

          {/* Informasi PIC */}
          <section>
            <h2 className="text-[15px] font-bold text-[#181C32] mb-6">Informasi PIC</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-[250px_1fr] items-center">
                <span className="text-[13px] text-[#7E8299]">Nama PIC</span>
                <span className="text-[13px] font-medium text-[#3F4254]">{data.picName}</span>
              </div>
              <div className="grid grid-cols-[250px_1fr] items-center">
                <span className="text-[13px] text-[#7E8299]">Email PIC</span>
                  <a href={`mailto:${data.picEmail}`} className="text-[13px] font-normal text-[#0095E8] underline">
                    {data.picEmail}
                  </a>
              </div>
            </div>
          </section>

          {/* Layanan */}
          <section>
            <h2 className="text-[15px] font-bold text-[#181C32] mb-6">Layanan</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-[250px_1fr] items-center">
                <span className="text-[13px] text-[#7E8299]">Total Kuota</span>
                <span className="text-[13px] font-medium text-[#3F4254]">{data.totalQuota} pengguna</span>
              </div>
              <div className="grid grid-cols-[250px_1fr] items-center">
                <span className="text-[13px] text-[#7E8299]">Kuota terpakai</span>
                <span className="text-[13px] font-medium text-[#3F4254]">{data.usedQuota} pengguna</span>
              </div>
              <div className="grid grid-cols-[250px_1fr] items-center">
                <span className="text-[13px] text-[#7E8299]">Sisa kuota</span>
                <span className="text-[13px] font-medium text-[#3F4254]">{data.totalQuota - data.usedQuota} pengguna</span>
              </div>
            </div>
          </section>

          {/* Perusahaan dan Departemen */}
          <section>
            <h2 className="text-[15px] font-bold text-[#181C32] mb-6">Perusahaan dan Departemen</h2>
            <div className="space-y-10">
              {data.companies?.map(company => (
                <div key={company.id} className="space-y-4">
                  <h3 className="text-[14px] font-bold text-[#3F4254]">{company.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-8">
                    {company.departments?.map(dept => (
                      <div key={dept.id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#A1A5B7]"></div>
                        <span className="text-[12px] uppercase text-[#7E8299] font-medium">{dept.name}</span>
                      </div>
                    ))}
                    {(!company.departments || company.departments.length === 0) && (
                      <span className="text-[12px] text-[#A1A5B7] italic">Belum ada departemen</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Info Banner Footer */}
        <div className="bg-[#F1FAFF] p-5 flex items-center gap-4 border-t border-[#F1F1F4]">
          <div className="w-6 h-6 rounded-full border border-[#0095E8] flex items-center justify-center text-[#0095E8] shrink-0">
            <Info size={14} />
          </div>
          <p className="text-[12px] text-[#5E6278]">
             Jika ada yang perlu untuk ditanyakan, bisa hubungi kami: <span className="text-[#0095E8] font-normal underline">Tim Support IT</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Organisasi;
