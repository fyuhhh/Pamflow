import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { authFetch } from '../services/api';

const DepartemenForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useModal();
  const isEdit = !!id;
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  const [formData, setFormData] = useState({
    name: '',
    dept_id: '',
    company_id: '',
    phone: '',
    whatsapp: '',
    status: 'Aktif'
  });

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
    if (isEdit) {
      fetchDepartment();
    } else {
      // If creating and not super admin, pre-fill company_id
      if (!isSuperAdmin) {
        setFormData(prev => ({ ...prev, company_id: user.company_id }));
      }
    }
  }, [id]);

  const fetchCompanies = async () => {
    try {
      const response = await authFetch('/api/companies');
      const data = await response.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchDepartment = async () => {
    try {
      const response = await authFetch(`/api/departments/${id}`);
      const data = await response.json();
      setFormData({
        name: data.name,
        dept_id: data.dept_id,
        company_id: data.company_id,
        phone: data.phone,
        whatsapp: data.whatsapp,
        status: data.status
      });
    } catch (error) {
      console.error('Error fetching department:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({ 
      ...prev, 
      status: prev.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif' 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = isEdit 
        ? `/api/departments/${id}`
        : '/api/departments';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        success('Berhasil', isEdit ? 'Departemen berhasil diperbarui' : 'Departemen berhasil dibuat');
        navigate('/pengaturan/departemen');
      } else {
        const errorData = await response.json();
        showError('Gagal', errorData.message || 'Gagal menyimpan data departemen');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showError('Kesalahan Jaringan', 'Terjadi kesalahan jaringan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/pengaturan/departemen')}
          className="p-2 hover:bg-[#F1F1F4] rounded-lg transition-colors"
        >
          <ChevronLeft size={24} className="text-[#A1A5B7]" />
        </button>
        <h1 className="text-[20px] font-semibold text-[#181C32]">
          {isEdit ? 'Edit Departemen' : 'Buat Departemen'}
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-[#F1F1F4] shadow-sm overflow-hidden">
        {/* Info Banner */}
        <div className="bg-[#F9F9F9] p-4 px-10 flex items-center gap-3 border-b border-[#F1F1F4]">
          <div className="w-5 h-5 rounded-full border border-[#7E8299] flex items-center justify-center text-[#7E8299]">
            <span className="text-[10px] font-bold">i</span>
          </div>
          <p className="text-[13px] text-[#7E8299]">Tanda <span className="text-[#F1416C]">(*)</span> adalah wajib di isi</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-6">
            {/* Nama Departemen */}
            <div className="grid grid-cols-[300px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-[#3F4254]">
                Nama departemen <span className="text-[#F1416C]">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-lg text-[13px] focus:ring-1 focus:ring-[#0095E8] outline-none placeholder:text-[#A1A5B7]"
                placeholder="Masukkan nama departemen"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* ID Departemen */}
            <div className="grid grid-cols-[300px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-[#3F4254]">
                ID departemen <span className="text-[#F1416C]">*</span>
              </label>
              <input
                type="text"
                name="dept_id"
                required
                className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-lg text-[13px] focus:ring-1 focus:ring-[#0095E8] outline-none placeholder:text-[#A1A5B7]"
                placeholder="Masukkan ID departemen"
                value={formData.dept_id}
                onChange={handleChange}
              />
            </div>

            {/* Perusahaan */}
            <div className="grid grid-cols-[300px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-[#3F4254]">
                Perusahaan <span className="text-[#F1416C]">*</span>
              </label>
              <select
                name="company_id"
                required
                disabled={!isSuperAdmin}
                className={`w-full px-4 py-2.5 border border-[#E1E3EA] rounded-lg text-[13px] focus:ring-1 focus:ring-[#0095E8] outline-none appearance-none bg-no-repeat bg-[right_1rem_center] ${
                  !isSuperAdmin ? 'bg-[#F5F8FA] text-[#A1A5B7] cursor-not-allowed' : 'bg-white'
                }`}
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23A1A5B7\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")' }}
                value={formData.company_id}
                onChange={handleChange}
              >
                <option value="">Pilih perusahaan</option>
                {companies
                  .filter(c => isSuperAdmin || c.id === user.company_id)
                  .map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name} {company.companyId ? `(${company.companyId})` : ''}
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Nomor Telepon */}
            <div className="grid grid-cols-[300px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-[#3F4254]">
                Nomor telepon <span className="text-[#F1416C]">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-4 py-2.5 bg-[#F9F9F9] text-[#3F4254] text-[13px] font-medium rounded-l-lg border border-r-0 border-[#E1E3EA]">+ 62</span>
                <input
                  type="text"
                  name="phone"
                  required
                  className="flex-1 px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-r-lg text-[13px] focus:ring-1 focus:ring-[#0095E8] outline-none placeholder:text-[#A1A5B7]"
                  placeholder="Masukkan nomor telepon departemen"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Nomor WhatsApp */}
            <div className="grid grid-cols-[300px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-[#3F4254]">
                Nomor WhatsApp <span className="text-[#F1416C]">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-4 py-2.5 bg-[#F9F9F9] text-[#3F4254] text-[13px] font-medium rounded-l-lg border border-r-0 border-[#E1E3EA]">+ 62</span>
                <input
                  type="text"
                  name="whatsapp"
                  required
                  className="flex-1 px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-r-lg text-[13px] focus:ring-1 focus:ring-[#0095E8] outline-none placeholder:text-[#A1A5B7]"
                  placeholder="Masukkan nomor WhatsApp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-[300px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-[#3F4254]">Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleStatusToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.status === 'Aktif' ? 'bg-[#0095E8]' : 'bg-[#E1E3EA]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.status === 'Aktif' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-[13px] font-medium text-[#7E8299]">{formData.status}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[#F1F1F4]">
            <button
              type="button"
              onClick={() => navigate('/pengaturan/departemen')}
              className="px-6 py-2 bg-white border border-[#0095E8] text-[#0095E8] hover:bg-[#F9F9F9] rounded-lg text-[12px] font-medium transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-[#0095E8] text-white hover:bg-[#0073B7] rounded-lg text-[12px] font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartemenForm;
