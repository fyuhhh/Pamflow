import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  User,
  Shield,
  Building2,
  Lock
} from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import SearchableSelect from './SearchableSelect';

const AdminForm = () => {
  const { id } = useParams();
  const { success, error: showError } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;

  const isAgen = location.pathname.includes('/pengguna/agen');
  const contextLabel = isAgen ? 'Agen' : 'Admin';
  const listLink = isAgen ? '/pengguna/agen' : '/pengguna/admin';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rolesList, setRolesList] = useState([]);
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
    password: '',
    role: '',
    orgId: currentOrgId || '',
    company_id: currentCompanyId || '',
    department: 'IT',
    userType: isAgen ? 'agen' : 'admin',
    status: 'Aktif'
  });

  useEffect(() => {
    fetchCompanies();
    fetchRoles();
    if (isEdit) fetchAdminData();
  }, [id]);

  const fetchRoles = async () => {
    try {
      const url = currentCompanyId ? `/api/roles?company_id=${currentCompanyId}` : '/api/roles';
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setRolesList(data.filter(r => r.status === 'Aktif'));
      }
    } catch (err) {}
  };

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

  const fetchAdminData = async () => {
    try {
      const response = await authFetch(`/api/users/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({ ...data, password: '', userType: data.userType || (isAgen ? 'agen' : 'admin'), status: data.status || 'Aktif' });
      } else {
        navigate(listLink);
      }
    } catch (err) {} finally { setFetching(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company_id') {
      const selectedCompany = companies.find(c => String(c.id) === String(value));
      setFormData({ ...formData, company_id: value, orgId: selectedCompany ? selectedCompany.companyId : formData.orgId });
    } else if (name === 'role') {
      const selectedRole = rolesList.find(r => r.name === value);
      setFormData({ ...formData, role: value, role_id: selectedRole ? selectedRole.id : null });
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
        success('Berhasil', `${contextLabel} berhasil disimpan`);
        navigate(listLink);
      } else {
        const errorData = await response.json();
        showError('Gagal', errorData.message || `Gagal menyimpan data.`);
      }
    } catch (err) { showError('Kesalahan Jaringan', 'Terjadi kesalahan.'); } finally { setLoading(false); }
  };

  if (fetching) return <div className="p-10 text-center text-[#A1A5B7]">Memuat...</div>;

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-[14px] font-bold text-[#181C32]">{isEdit ? 'Edit' : 'Tambah'} {contextLabel}</h2>
         <button onClick={() => navigate(listLink)} className="flex items-center gap-2 px-4 py-2 bg-[#F5F8FA] text-[#7E8299] rounded-lg text-[12px] font-bold hover:bg-[#E1E3EA] transition-colors">
            <ArrowLeft size={16} /> Kembali
         </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Info */}
        <div className="bg-white rounded-xl border border-[#E1E3EA] p-8">
           <div className="mb-8 pb-4 border-b border-[#F5F8FA]">
              <h3 className="text-[14px] font-bold text-[#181C32]">Informasi Akun</h3>
              <p className="text-[12px] text-[#A1A5B7]">Detail dasar untuk akun pengguna</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">No. Karyawan (NIK)</label>
                 <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Email Kantor <span className="text-red-500">*</span></label>
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
                 <label className="text-[12px] font-bold text-[#3F4254]">Password {isEdit && '(Opsional)'}</label>
                 <input type="password" name="password" required={!isEdit} value={formData.password} onChange={handleChange} placeholder={isEdit ? "Kosongkan jika tidak diubah" : "••••••••"} className="w-full px-4 py-3 bg-[#F5F8FA] border-none rounded-lg text-[13px] text-[#3F4254] outline-none focus:ring-2 focus:ring-[#0095E8]/20" />
              </div>
           </div>
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl border border-[#E1E3EA] p-8">
           <div className="mb-8 pb-4 border-b border-[#F5F8FA]">
              <h3 className="text-[14px] font-bold text-[#181C32]">Hak Akses & Departemen</h3>
              <p className="text-[12px] text-[#A1A5B7]">Tentukan otorisasi pengguna dalam sistem</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Hak Akses <span className="text-red-500">*</span></label>
                 <SearchableSelect name="role" options={rolesList.length > 0 ? rolesList : [{ id: 1, name: 'Admin' }, { id: 2, name: 'Super Admin' }]} value={formData.role} valueField="name" onChange={handleChange} />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Perusahaan <span className="text-red-500">*</span></label>
                 <SearchableSelect name="company_id" options={companies} value={formData.company_id} onChange={handleChange} disabled={!isSuperAdmin} />
              </div>
              <div className="space-y-2">
                 <label className="text-[12px] font-bold text-[#3F4254]">Departemen <span className="text-red-500">*</span></label>
                 <SearchableSelect name="department" options={departments} value={formData.department} valueField="name" onChange={handleChange} />
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

        <div className="flex justify-end gap-3 pt-4">
           <button type="button" onClick={() => navigate(listLink)} className="px-6 py-3 bg-white border border-[#E1E3EA] text-[#7E8299] rounded-lg text-[13px] font-bold hover:bg-[#F5F8FA] transition-colors">Batal</button>
           <button type="submit" disabled={loading} className="px-8 py-3 bg-[#0095E8] text-white rounded-lg text-[13px] font-bold hover:bg-[#0084CC] transition-all flex items-center gap-2 shadow-lg shadow-[#0095E8]/20">
              <Save size={18} />
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
           </button>
        </div>
      </form>
    </div>
  );
};

export default AdminForm;
