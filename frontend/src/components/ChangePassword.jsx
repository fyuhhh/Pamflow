import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { authFetch } from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  // ... rest of state
  const { success, error: showError } = useModal();
  const user = JSON.parse(localStorage.getItem('user'));
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    currentPassword: ''
  });

  const [showPwd, setShowPwd] = useState({
    new: false,
    confirm: false,
    current: false
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleShow = (field) => {
    setShowPwd(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Validation conditions
  const pwd = formData.newPassword;
  const conditions = {
    length: pwd.length >= 8,
    number: /\d/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    special: /[/[!@#$%^&*()_~\]]/.test(pwd)
  };
  const isPasswordValid = Object.values(conditions).every(Boolean);
  const isConfirmValid = formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleUpdate = async () => {
    if (!isPasswordValid) return showError('Password Tidak Valid', 'Silakan penuhi semua ketentuan password baru.');
    if (!isConfirmValid) return showError('Konfirmasi Gagal', 'Konfirmasi password tidak cocok.');
    if (!formData.currentPassword) return showError('Data Tidak Lengkap', 'Current Password wajib diisi.');

    setLoading(true);
    try {
      const response = await authFetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: pwd
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        success('Berhasil', 'Password berhasil diperbarui');
        setFormData({ newPassword: '', confirmPassword: '', currentPassword: '' });
      } else {
        showError('Gagal', data.message || 'Gagal memperbarui password');
      }
    } catch (error) {
      console.error('Update password error:', error);
      showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const CheckItem = ({ label, checked }) => (
    <div className="flex items-center gap-2 mb-1">
      <CheckCircle2 size={14} className={checked ? "text-[#50CD89]" : "text-[#A1A5B7]"} />
      <span className={`text-[12px] ${checked ? "text-[#3F4254]" : "text-[#7E8299]"}`}>{label}</span>
    </div>
  );

  return (
    <div className="p-8 px-10">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-white border border-[#E4E6EF] flex items-center justify-center text-[#0095E8] shadow-sm hover:bg-[#F5F8FA] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-[16px] font-semibold text-[#181C32]">Change Password</h2>
      </div>
      
      <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="p-8">
          <h3 className="text-[14px] font-bold text-[#181C32] mb-8">Password Update</h3>

          {/* New Password Section */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            <div className="col-span-3 pt-3 text-[13px] text-[#7E8299]">New password</div>
            <div className="col-span-9">
              <div className="relative max-w-2xl">
                <input 
                  type={showPwd.new ? "text" : "password"}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-[#E4E6EF] rounded-lg text-[13px] outline-none focus:border-[#0095E8] pr-10 transition-colors"
                />
                <button 
                  onClick={() => toggleShow('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] hover:text-[#7E8299] focus:outline-none"
                >
                  {showPwd.new ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              {/* Ketentuan Password */}
              <div className="mt-4">
                <p className="text-[12px] text-[#7E8299] mb-2 font-medium">Ketentuan password</p>
                <CheckItem label="Minimal 8 karakter" checked={conditions.length} />
                <CheckItem label="Minimal 1 angka" checked={conditions.number} />
                <CheckItem label="Minimal 1 huruf kecil" checked={conditions.lowercase} />
                <CheckItem label="Minimal 1 huruf kapital" checked={conditions.uppercase} />
                <CheckItem label="Minimal 1 karakter khusus, contoh: / [ !@#$%^&*()_~ ]" checked={conditions.special} />
              </div>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="grid grid-cols-12 gap-6 pb-8 border-b border-[#F1F1F4]">
            <div className="col-span-3 pt-3 text-[13px] text-[#7E8299]">Confirm new password</div>
            <div className="col-span-9">
              <div className="relative max-w-2xl">
                <input 
                  type={showPwd.confirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Enter new password confirmation"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] outline-none pr-10 transition-colors ${
                    formData.confirmPassword.length > 0 && !isConfirmValid 
                      ? 'border-[#F1416C] focus:border-[#F1416C] bg-[#FFF5F8]' 
                      : 'border-[#E4E6EF] focus:border-[#0095E8]'
                  }`}
                />
                <button 
                  onClick={() => toggleShow('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] hover:text-[#7E8299] focus:outline-none"
                >
                  {showPwd.confirm ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {formData.confirmPassword.length > 0 && !isConfirmValid && (
                <p className="text-[#F1416C] text-[11px] mt-1">Password tidak cocok</p>
              )}
            </div>
          </div>

          {/* Authenticate Section */}
          <div className="pt-8">
            <h3 className="text-[14px] font-bold text-[#181C32] mb-1">Authenticate to Update Password</h3>
            <p className="text-[12px] text-[#A1A5B7] mb-6">Password required to confirm data changes</p>

            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-3 pt-3 text-[13px] text-[#7E8299]">Current Password <span className="text-[#F1416C]">*</span></div>
              <div className="col-span-9">
                <div className="relative max-w-2xl">
                  <input 
                    type={showPwd.current ? "text" : "password"}
                    name="currentPassword"
                    placeholder="Enter current password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-[#E4E6EF] rounded-lg text-[13px] outline-none focus:border-[#0095E8] pr-10 transition-colors"
                  />
                  <button 
                    onClick={() => toggleShow('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] hover:text-[#7E8299] focus:outline-none"
                  >
                    {showPwd.current ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleUpdate}
                disabled={loading || !isPasswordValid || !isConfirmValid || !formData.currentPassword}
                className="px-8 py-2.5 bg-[#0095E8] rounded-lg text-[13px] font-bold text-white hover:bg-[#0084CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ChangePassword;
