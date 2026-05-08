import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, ChevronRight, ArrowLeft, Bell, BellOff, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { checkPushSubscriptionStatus, subscribeToPushNotifications, unsubscribeFromPushNotifications, testPushNotification } from '../services/pushService';

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = user.firstName || 'User';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const role = user.role || 'Admin Organization';
  const orgName = user.orgId || 'PAM';
  const email = user.email || '-';
  const phone = user.phone || '+6282199571633';

  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isLoadingPush, setIsLoadingPush] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkPushSubscriptionStatus();
      setIsPushEnabled(status);
    };
    checkStatus();
  }, []);

  const handleTogglePush = async () => {
    setIsLoadingPush(true);
    try {
      if (isPushEnabled) {
        const res = await unsubscribeFromPushNotifications();
        if (res?.success) {
          setIsPushEnabled(false);
          toast.success(res.message);
        } else {
          toast.error(res?.message || 'Gagal menonaktifkan notifikasi');
        }
      } else {
        const res = await subscribeToPushNotifications(user.id, false);
        if (res?.success) {
          setIsPushEnabled(true);
          toast.success(res.message);
        } else {
          toast.error(res?.message || 'Gagal mengaktifkan notifikasi');
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsLoadingPush(false);
    }
  };

  const handleTestPush = async () => {
    setIsLoadingPush(true);
    const res = await testPushNotification(user.id);
    if (res?.success) {
      toast.success(res.message);
    } else {
      toast.error(res?.message || 'Gagal mengirim notifikasi tes');
    }
    setIsLoadingPush(false);
  };

  return (
    <div className="p-8 px-10 bg-[#F5F8FA] min-h-full font-sans">
      {/* Breadcrumb style header */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-white border border-[#E4E6EF] flex items-center justify-center text-[#0095E8] shadow-sm hover:bg-[#F5F8FA] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-[16px] font-semibold text-[#181C32]">Profile</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#F1F1F4] overflow-hidden">
        {/* Card Header */}
        <div className="px-10 py-5 border-b border-[#F1F1F4]">
          <h3 className="text-[14px] font-bold text-[#181C32]">Data Personal</h3>
        </div>

        {/* Form Content */}
        <div className="p-10 space-y-6">
          {/* Nama */}
          <div className="flex items-start gap-8">
            <label className="w-48 text-[13px] font-medium text-[#7E8299]">Nama</label>
            <span className="flex-1 text-[13px] font-medium text-[#3F4254]">{fullName}</span>
          </div>

          {/* Hak akses */}
          <div className="flex items-start gap-8">
            <label className="w-48 text-[13px] font-medium text-[#7E8299]">Hak akses</label>
            <span className="flex-1 text-[13px] font-medium text-[#3F4254]">{role}</span>
          </div>

          {/* Organisasi */}
          <div className="flex items-start gap-8">
            <label className="w-48 text-[13px] font-medium text-[#7E8299]">Organisasi</label>
            <span className="flex-1 text-[13px] font-medium text-[#3F4254]">{orgName}</span>
          </div>

          {/* ID Organisasi */}
          <div className="flex items-start gap-8">
            <label className="w-48 text-[13px] font-medium text-[#7E8299]">ID Organisasi</label>
            <span className="flex-1 text-[13px] font-medium text-[#3F4254]">{orgName}</span>
          </div>

          {/* Email */}
          <div className="flex items-start gap-8">
            <label className="w-48 text-[13px] font-medium text-[#7E8299]">Email</label>
            <span className="flex-1 text-[13px] font-medium text-[#0095E8]">{email}</span>
          </div>

          {/* Nomor telepon */}
          <div className="flex items-start gap-8">
            <label className="w-48 text-[13px] font-medium text-[#7E8299]">Nomor telepon</label>
            <span className="flex-1 text-[13px] font-medium text-[#3F4254]">{phone}</span>
          </div>

          {/* Ubah Button */}
          <div className="pt-4">
            <button className="flex items-center gap-2 px-6 py-2 bg-white border border-[#E4E6EF] rounded-lg text-[12px] font-bold text-[#0095E8] hover:bg-blue-50 hover:border-[#0095E8] transition-all shadow-sm">
              <Pencil size={14} />
              Ubah
            </button>
          </div>
        </div>
      </div>

      {/* Push Notification Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-[#F1F1F4] overflow-hidden mt-6">
        <div className="px-10 py-5 border-b border-[#F1F1F4] flex items-center gap-2">
          <Bell size={18} className="text-[#181C32]" />
          <h3 className="text-[14px] font-bold text-[#181C32]">Pengaturan Notifikasi Push</h3>
        </div>

        <div className="p-10 space-y-6">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[#7E8299]">Status Notifikasi Saat Ini:</span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPushEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-[14px] font-bold text-[#3F4254]">
                {isPushEnabled ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
            <p className="text-[12px] text-[#A1A5B7] mt-1">
              Dengan mengaktifkan fitur ini, Anda akan menerima pemberitahuan di perangkat ini saat ada Tugas atau Work Order baru yang ditugaskan ke Anda atau departemen Anda, meskipun aplikasi sedang ditutup.
            </p>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={handleTogglePush}
              disabled={isLoadingPush}
              className={`flex items-center gap-2 px-6 py-2 border rounded-lg text-[12px] font-bold transition-all shadow-sm ${
                isPushEnabled 
                  ? 'bg-white border-red-500 text-red-500 hover:bg-red-50' 
                  : 'bg-[#0095E8] border-[#0095E8] text-white hover:bg-blue-600'
              } disabled:opacity-50`}
            >
              {isPushEnabled ? <BellOff size={14} /> : <Bell size={14} />}
              {isLoadingPush ? 'Memproses...' : isPushEnabled ? 'Nonaktifkan Notifikasi' : 'Aktifkan Notifikasi'}
            </button>

            {isPushEnabled && (
              <button 
                onClick={handleTestPush}
                disabled={isLoadingPush}
                className="flex items-center gap-2 px-6 py-2 bg-white border border-[#E4E6EF] rounded-lg text-[12px] font-bold text-[#3F4254] hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
              >
                <Send size={14} />
                Test Notifikasi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
