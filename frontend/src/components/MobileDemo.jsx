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
import { useNavigate, useLocation, useParams } from 'react-router-dom';

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

  const renderContent = () => {
    if (location.pathname.endsWith('/form')) {
      return <MobileTaskForm />;
    }

    if (location.pathname.startsWith('/demo/mobile/approval/')) {
      return <MobileApprovalDetail />;
    }

    if (location.pathname.startsWith('/demo/mobile/task/')) {
      return <MobileTaskDetail />;
    }

    switch (location.pathname) {
      case '/demo/mobile/tasks':
        return <MobileTasks />;
      case '/demo/mobile/notifications':
        return <MobileNotifications />;

      case '/demo/mobile/profile':
        return <MobileProfile onLogout={onLogout} />;
      case '/demo/mobile/dept-tasks':
        return <MobileDeptTaskList />;
      case '/demo/mobile/approvals':
        return <MobileApprovalList />;
      case '/demo/mobile/dept-task/:id': // Managed by startsWith but included for clarity
        return <MobileDeptTaskDetail />;
      default:
        if (location.pathname.startsWith('/demo/mobile/dept-task/')) {
          return <MobileDeptTaskDetail />;
        }
        return <MobileHome />;
    }
  };

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
          {renderContent()}
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
