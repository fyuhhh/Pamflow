import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  User,
  Smartphone,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import SearchableSelect from './SearchableSelect';

const AgenForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useModal();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const currentOrgId = user?.orgId;
  const currentCompanyId = user?.company_id;
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: 'password123', 
    pin: '123456', 
    orgId: currentOrgId || '',
    company_id: currentCompanyId || '',
    department: '',
    userType: 'agen',
    status: 'Aktif',
    can_approve: false,
    username: '',
    permissions: {}
  });

  useEffect(() => {
    fetchCompanies();
    if (isEdit) fetchAgenData();
  }, [id]);

  const fetchCompanies = async () => {
    try {
      const response = await authFetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (err) {}
  };

  const fetchDepartments = async (companyId) => {
    if (!companyId) { setDepartments([]); return; }
    try {
      const response = await authFetch(`/api/departments?company_id=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (formData.company_id) fetchDepartments(formData.company_id);
  }, [formData.company_id]);

  const fetchAgenData = async () => {
    try {
      const response = await authFetch(`/api/users/${id}`);
      if (response.ok) {
        const data = await response.json();
        let parsedPermissions = {};
        if (data.permissions) {
          try {
            parsedPermissions = typeof data.permissions === 'string' ? JSON.parse(data.permissions) : data.permissions;
          } catch (e) {}
        }
        setFormData({ ...data, permissions: parsedPermissions });
      } else {
        navigate('/pengguna/agen');
      }
    } catch (err) {} finally { setFetching(false); }
  };

  const MOBILE_MENUS = [
    { id: 'checklist_harian', label: 'Checklist Harian' },
    { id: 'riwayat_checklist', label: 'Riwayat Checklist' },
    { id: 'daftar_tugas', label: 'Daftar Tugas' },
    { id: 'catat_listrik', label: 'Catat Listrik' },
    { id: 'pengoperasian_aset', label: 'Pengoperasian Aset' },
    { id: 'persetujuan_dokumen', label: 'Persetujuan Dokumen' }
  ];

  const handleMenuToggle = (menuId) => {
    const currentMenus = formData.permissions?.mobile_menus || [];
    const newMenus = currentMenus.includes(menuId)
      ? currentMenus.filter(id => id !== menuId)
      : [...currentMenus, menuId];
    
    setFormData({
      ...formData,
      permissions: {
        ...(formData.permissions || {}),
        mobile_menus: newMenus
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company_id') {
      const selectedCompany = companies.find(c => String(c.id) === String(value));
      setFormData({ ...formData, company_id: value, orgId: selectedCompany ? selectedCompany.companyId : formData.orgId });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authFetch(isEdit ? `/api/users/${id}` : '/api/users', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        success('Berhasil', 'Data agen berhasil disimpan');
        navigate('/pengguna/agen');
      } else {
        const data = await response.json();
        showError('Gagal', data.message || `Gagal menyimpan.`);
      }
    } catch (err) { showError('Kesalahan', 'Terjadi kesalahan jaringan.'); } finally { setLoading(false); }
  };

  if (fetching) return <div className="p-10 text-center text-[#A1A5B7]">Memuat...</div>;

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-[14px] font-bold text-[#181C32]">{isEdit ? 'Edit' : 'Tambah'} Agen</h2>
         <button onClick={() => navigate('/pengguna/agen')} className="flex items-center gap-2 px-4 py-2 bg-[#F5F8FA] text-[#7E8299] rounded-lg text-[12px] font-bold hover:bg-[#E1E3EA] transition-colors">
            <ArrowLeft size={16} /> Kembali
         </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="bg-white rounded-xl border border-[#E1E3EA] p-8">
           <div className="mb-8 pb-4 border-b border-[#F5F8FA]">
              <h3 className="text-[14px] font-bold text-[#181C32]">Identitas Agen</h3>
              <p className="text-[12px] text-[#A1A5B7]">Informasi profil dasar agen lapangan</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">No. Karyawan (NIK)</label>
                 <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Email <span className="text-red-500">*</span></label>
                 <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Nama Depan <span className="text-red-500">*</span></label>
                 <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Nama Belakang</label>
                 <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Nomor Telepon <span className="text-red-500">*</span></label>
                 <div className="flex">
                    <span className="px-4 py-3 bg-[#E1E3EA] border-none rounded-l-lg text-[13px] font-bold text-[#3F4254]">+62</span>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="flex-1 px-4 py-3 bg-[#F5F8FA] border-none rounded-r-lg text-[13px] text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Status</label>
                 <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] font-bold text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20 appearance-none">
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Mobile Credentials */}
        <div className="bg-white rounded-xl border border-[#E1E3EA] p-8">
           <div className="mb-8 pb-4 border-b border-[#F5F8FA]">
              <h3 className="text-[14px] font-bold text-[#181C32]">Kredensial Mobile</h3>
              <p className="text-[12px] text-[#A1A5B7]">Data login untuk aplikasi mobile agen</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Username <span className="text-red-500">*</span></label>
                 <input type="text" name="username" required value={formData.username || ''} onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] font-bold text-[#0095E8] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">PIN (6 Digit) <span className="text-red-500">*</span></label>
                 <input type="text" name="pin" required maxLength={6} value={formData.pin || ''} onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] font-bold tracking-[0.5em] text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
              </div>
           </div>
        </div>

        {/* Structure */}
        <div className="bg-white rounded-xl border border-[#E1E3EA] p-8">
           <div className="mb-8 pb-4 border-b border-[#F5F8FA]">
              <h3 className="text-[14px] font-bold text-[#181C32]">Unit & Otoritas</h3>
              <p className="text-[12px] text-[#A1A5B7]">Penempatan unit kerja dan hak persetujuan</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Perusahaan <span className="text-red-500">*</span></label>
                 <SearchableSelect name="company_id" options={companies} value={formData.company_id} onChange={handleChange} disabled={!isSuperAdmin} />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Departemen <span className="text-red-500">*</span></label>
                 <SearchableSelect name="department" options={departments} value={formData.department} valueField="name" onChange={handleChange} />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F5F8FA] rounded-lg border border-[#E1E3EA] col-span-full">
                 <div>
                    <span className="text-[13px] font-bold text-[#3F4254]">Izinkan Approval Tugas</span>
                    <p className="text-[11px] text-[#A1A5B7]">Agen dapat menyetujui tugas tertentu di mobile</p>
                 </div>
                 <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.can_approve ? 'bg-[#50CD89]' : 'bg-[#E1E3EA]'}`} onClick={() => setFormData({...formData, can_approve: !formData.can_approve})}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${formData.can_approve ? 'translate-x-6' : 'translate-x-0'}`}></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Hak Akses Menu Mobile */}
        <div className="bg-white rounded-xl border border-[#E1E3EA] p-8">
           <div className="mb-8 pb-4 border-b border-[#F5F8FA]">
              <h3 className="text-[14px] font-bold text-[#181C32]">Hak Akses Menu Mobile</h3>
              <p className="text-[12px] text-[#A1A5B7]">Pilih menu apa saja yang dapat diakses oleh agen ini di aplikasi mobile.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOBILE_MENUS.map(menu => {
                const isChecked = formData.permissions?.mobile_menus?.includes(menu.id) || false;
                return (
                  <div 
                    key={menu.id} 
                    onClick={() => handleMenuToggle(menu.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-[#F1FAFF] border-[#0095E8] shadow-sm' : 'bg-white border-[#E1E3EA] hover:border-[#0095E8]/30'}`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isChecked ? 'bg-[#0095E8]' : 'bg-[#E1E3EA]'}`}>
                      {isChecked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <span className={`text-[13px] font-bold ${isChecked ? 'text-[#0095E8]' : 'text-[#3F4254]'}`}>{menu.label}</span>
                  </div>
                );
              })}
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
           <button type="button" onClick={() => navigate('/pengguna/agen')} className="px-6 py-3 bg-white border border-[#E1E3EA] text-[#7E8299] rounded-lg text-[13px] font-bold hover:bg-[#F5F8FA] transition-colors">Batal</button>
           <button type="submit" disabled={loading} className="px-8 py-3 bg-[#0095E8] text-white rounded-lg text-[13px] font-bold hover:bg-[#0084CC] transition-all flex items-center gap-2 shadow-lg shadow-[#0095E8]/20">
              <Save size={18} />
              {loading ? 'Menyimpan...' : 'Simpan Agen'}
           </button>
        </div>
      </form>
    </div>
  );
};

export default AgenForm;
