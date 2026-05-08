import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

const AdminDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: showError } = useModal();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Detect context
  const isAgen = location.pathname.includes('/pengguna/agen');
  const contextLabel = isAgen ? 'Agen' : 'Admin';
  const backLink = isAgen ? '/pengguna/agen' : '/pengguna/admin';

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await authFetch(`/api/users/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAdmin(data);
      } else {
        showError('Tidak Ditemukan', `Data ${contextLabel.toLowerCase()} tidak ditemukan`);
        navigate(backLink);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-[#A1A5B7]">Loading detail...</div>;
  if (!admin) return null;

  const detailItems = [
    { label: 'Nomor karyawan', value: admin.employeeId || '-' },
    { 
      label: 'Nama lengkap', 
      value: (
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#3F4254]">{admin.firstName} {admin.lastName}</span>
          {admin.role?.toLowerCase() === 'super admin' && (
            <Star size={14} className="text-[#0095E8] fill-[#0095E8]/10" />
          )}
          <span className="px-2 py-0.5 bg-[#E8FFF3] text-[#50CD89] text-[10px] font-bold rounded uppercase">Aktif</span>
        </div>
      ) 
    },
    { label: 'Email', value: admin.email },
    { label: 'Nomor telepon', value: `+62${admin.phone || ''}` },
    { label: 'Hak akses', value: admin.role || 'L3 - Supervisor' },
    { label: 'Organisasi', value: admin.orgId || 'PAM' },
    { label: 'Status', value: (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
        admin.status === 'Aktif' ? 'bg-[#E8FFF3] text-[#50CD89]' : 'bg-[#FFF8DD] text-[#F1BC00]'
      }`}>
        {admin.status || 'Aktif'}
      </span>
    )},
    { label: 'Perusahaan', value: admin.orgId === 'PAM' ? 'Ewalk Pentacity Mall' : admin.orgId },
    { label: 'Departemen', value: admin.department || 'IT' },
    { label: 'Aktivitas terakhir', value: '-' },
  ];

  return (
    <div className="p-8 px-10">
      <div className="bg-white rounded-xl shadow-sm border border-[#F1F1F4] overflow-hidden">
        {/* Back Link */}
        <div className="p-6 border-b border-[#F1F1F4]">
          <Link 
            to={backLink} 
            className="flex items-center gap-2 text-[#0095E8] hover:text-[#0084CC] transition-colors text-sm font-semibold"
          >
            <ArrowLeft size={16} />
            Kembali ke {contextLabel.toLowerCase()} list
          </Link>
        </div>

        {/* Detail Content */}
        <div className="p-10 py-8 space-y-6">
          {detailItems.map((item, index) => (
            <div key={index} className="flex items-start">
              <label className="w-64 text-sm font-semibold text-[#7E8299]">{item.label}</label>
              <div className="flex-1 text-sm text-[#3F4254]">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDetail;
