import React from 'react';
import MobileAppLayout from './MobileAppLayout';
import MobileHome from './MobileHome';
import MobileTasks from './MobileTasks';
import MobileProfile from './MobileProfile';
import MobileTaskDetail from './MobileTaskDetail';
import MobileTaskForm from './MobileTaskForm';

import MobileNotifications from './MobileNotifications';
import MobileDeptTaskList from './MobileDeptTaskList';
import MobileDeptTaskDetail from './MobileDeptTaskDetail';
import MobileApprovalList from './MobileApprovalList';
import MobileApprovalDetail from './MobileApprovalDetail';
import ChecklistHarian from './ChecklistHarian';
import BuatTugasDepartemen from './BuatTugasDepartemen';
import MonitoringAset from './MonitoringAset';
import MobileUtilityListrik from './MobileUtilityListrik';
import { useNavigate, useLocation, useParams, Routes, Route, Navigate } from 'react-router-dom';

import { Smartphone, Monitor } from 'lucide-react';



const MobileDemo = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [prevPath, setPrevPath] = React.useState(location.pathname);
  const [animDirection, setAnimDirection] = React.useState('forward');

  const pathOrder = [
    '/demo/mobile',
    '/demo/mobile/tasks',
    '/demo/mobile/checklist',
    '/demo/mobile/checklist/buat-wo',
    '/demo/mobile/aset',
    '/demo/mobile/profile'
  ];

  React.useEffect(() => {
    if (location.pathname !== prevPath) {
      const prevIndex = pathOrder.indexOf(prevPath);
      const currIndex = pathOrder.indexOf(location.pathname);

      if (prevIndex !== -1 && currIndex !== -1) {
        setAnimDirection(currIndex > prevIndex ? 'forward' : 'backward');
      } else if (prevIndex === -1 && currIndex !== -1) {
        // Returning to a main tab from a detail/sub-page
        setAnimDirection('backward');
      } else {
        // Going from a main tab to a detail page, or sub-to-sub
        setAnimDirection('forward');
      }
      setPrevPath(location.pathname);
    }
  }, [location.pathname, prevPath]);

  // Initial loading effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500); // 1.5s for a professional feel
    return () => clearTimeout(timer);
  }, []);

  // Safety check to prevent white screen if user is missing
  React.useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return <div className="min-h-screen bg-white" />;

  const getPullColor = () => {
    if (location.pathname === '/demo/mobile') return '#F8FAFC';
    if (location.pathname === '/demo/mobile/profile') return '#004D99';
    return '#FFFFFF';
  };

  return (
    <div className="h-full bg-white font-sans overflow-hidden relative">

        {/* Professional Initial Loading Splash - Matched to Gambar 1 */}
        {initialLoading && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="buffering-ring mb-5" />
            <p className="text-[16px] font-bold text-[#1B3B6F] tracking-tight">Loading...</p>
          </div>
        )}

        <MobileAppLayout user={user} pullColor={getPullColor()}>
          <div 
            key={location.pathname}
            className={`h-full mobile-view-container ${animDirection === 'forward' ? 'slide-forward' : 'slide-backward'}`}
          >
            <Routes>
              <Route index element={<MobileHome />} />
              <Route path="tasks" element={<MobileTasks />} />
              <Route path="checklist" element={<ChecklistHarian />} />
              <Route path="checklist-riwayat" element={<ChecklistHarian />} />
              <Route path="checklist/buat-wo" element={<BuatTugasDepartemen taskType="wo" />} />
              <Route path="notifications" element={<MobileNotifications />} />
              <Route path="profile" element={<MobileProfile onLogout={onLogout} />} />
              <Route path="dept-tasks" element={<MobileDeptTaskList />} />
              <Route path="dept-task/:id" element={<MobileDeptTaskDetail />} />
              <Route path="approvals" element={<MobileApprovalList />} />
              <Route path="approval/:taskId" element={<MobileApprovalDetail />} />
              <Route path="task/:taskId" element={<MobileTaskDetail />} />
              <Route path="task/:taskId/form" element={<MobileTaskForm />} />
              <Route path="aset" element={<MonitoringAset />} />
              <Route path="utility-listrik" element={<MobileUtilityListrik />} />
              <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
          </div>
        </MobileAppLayout>

        <style>{`
          /* No transition animations on page container — 
             any animation (even opacity-only) creates a new containing block 
             on iOS Safari, which breaks position:fixed in children */

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .buffering-ring {
            width: 60px;
            height: 60px;
            border: 6px solid #E1E9F4;
            border-top-color: #0095E8;
            border-radius: 50%;
            animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
      </div>
  );

};

export default MobileDemo;
