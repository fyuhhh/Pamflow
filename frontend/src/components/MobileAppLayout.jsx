import React, { useRef, useEffect, useState } from 'react';
import { Home, ClipboardList, UserCircle, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';

const MobileAppLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // Reset scroll to top on route change
  useEffect(() => {
    const t = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 10);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const canApprove = user?.can_approve === 1 || user?.can_approve === true;
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending approval count
  useEffect(() => {
    if (!canApprove) return;
    const fetchCount = async () => {
      try {
        const response = await authFetch(
          `/api/tasks/pending-approval?company_id=${user?.company_id}&departemen=${encodeURIComponent(user?.department || '')}`
        );
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.length);
        }
      } catch (err) {
        console.error('Error fetching pending count:', err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [canApprove]);

  const navItems = [
    { icon: Home, label: 'Beranda', path: '/demo/mobile' },
    { icon: ClipboardList, label: 'Tugas', path: '/demo/mobile/tasks' },
    ...(canApprove ? [{ icon: ShieldCheck, label: 'Approval', path: '/demo/mobile/approvals' }] : []),
    { icon: UserCircle, label: 'Profil', path: '/demo/mobile/profile' },
  ];

  // Only show bottom nav on main tab pages — hide everywhere else
  const mainPaths = ['/demo/mobile', '/demo/mobile/tasks', '/demo/mobile/profile', '/demo/mobile/approvals'];
  const showNav = mainPaths.includes(location.pathname);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        backgroundColor: 'white',
      }}
    >
      {/* Scrollable content */}
      <main
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          minHeight: 0,
        }}
      >
        {children}
        {/* spacer so content isn't hidden behind fixed action bar on task detail */}
        {!showNav && <div style={{ height: '90px' }} />}
      </main>

      {/* Bottom navigation — id="mobile-nav-bar" so modals (MobileProfile etc.) can hide it */}
      {showNav && (
        <nav
          id="mobile-nav-bar"
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            backgroundColor: 'white',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '8px',
            paddingBottom: '6px',
            flexShrink: 0,
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: active ? '#0095E8' : '#94a3b8',
                  padding: '0 16px',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  padding: '3px',
                  borderRadius: '8px',
                  backgroundColor: active ? '#E3F2FD' : 'transparent',
                  position: 'relative',
                }}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  {item.path === '/demo/mobile/approvals' && pendingCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-6px',
                      backgroundColor: '#F1416C',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 700,
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      lineHeight: '16px',
                      boxShadow: '0 0 4px rgba(241,65,108,0.4)',
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', fontWeight: 500 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default MobileAppLayout;
