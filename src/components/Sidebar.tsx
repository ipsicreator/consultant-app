import { useEffect, useState } from 'react';
import { Users, FileText, Settings, LogOut, Building, Calendar, Lightbulb, BookOpen, ChevronLeft, ChevronRight, Database, Compass } from 'lucide-react';
import { pb } from '../lib/pocketbase';
import { resolveOrCreateProfile } from '../lib/profileLink';
import './Sidebar.css';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

function MenuItem({ active, icon, label, onClick, collapsed }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; collapsed: boolean }) {
  return (
    <li className={active ? 'active' : ''} onClick={onClick}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </li>
  );
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const [userName, setUserName] = useState('사용자');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!pb.authStore.isValid || !pb.authStore.model) return;
      try {
        const profile = await resolveOrCreateProfile();
        if (profile?.name) setUserName(profile.name);
        else setUserName(String((pb.authStore.model as any)?.email || '사용자').split('@')[0]);
      } catch (error) {
        console.error('Sidebar fetch user error:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      pb.authStore.clear();
      window.location.reload();
    }
  };

  return (
    <div className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          {isCollapsed ? (
            <div className="logo-icon" style={{ color: '#1e293b', fontWeight: 'bold', fontSize: '1.2rem' }}>S</div>
          ) : (
            <img src="/logo.png" alt="수프리마 플랫폼 로고" className="brand-logo" />
          )}
        </div>
        {!isCollapsed && <p className="subtitle" style={{ textAlign: 'center', width: '100%', display: 'block' }}>교과 탐구 • 세특 코칭 플랫폼</p>}
        <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div style={{ marginBottom: '1rem' }}>
          {!isCollapsed && <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.12em' }}>학생 관리</div>}
          <ul>
            <MenuItem active={currentView === 'dashboard'} icon={<Users size={20} />} label="학생 CRM 관리" onClick={() => onNavigate('dashboard')} collapsed={isCollapsed} />
            <MenuItem active={currentView === 'student'} icon={<FileText size={20} />} label="학생부/성적분석" onClick={() => onNavigate('student')} collapsed={isCollapsed} />
            <MenuItem active={currentView === 'exploration'} icon={<Lightbulb size={20} />} label="주제탐구활동" onClick={() => onNavigate('exploration')} collapsed={isCollapsed} />
          </ul>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          {!isCollapsed && <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.12em' }}>학습/입시 설계</div>}
          <ul>
            <MenuItem active={currentView === 'admission'} icon={<Compass size={20} />} label="입시위치 진단" onClick={() => onNavigate('admission')} collapsed={isCollapsed} />
            <MenuItem active={currentView === 'planner'} icon={<Calendar size={20} />} label="학습/일정 계획" onClick={() => onNavigate('planner')} collapsed={isCollapsed} />
            <MenuItem active={currentView === 'inquiry_guide'} icon={<BookOpen size={20} />} label="심화탐구가이드" onClick={() => onNavigate('inquiry_guide')} collapsed={isCollapsed} />
          </ul>
        </div>

        <div>
          {!isCollapsed && <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.12em' }}>데이터 플랫폼</div>}
          <ul>
            <MenuItem active={currentView === 'bigdata'} icon={<Database size={20} />} label="대학 지식정보 플랫폼" onClick={() => onNavigate('bigdata')} collapsed={isCollapsed} />
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <ul>
          <MenuItem active={currentView === 'admin'} icon={<Building size={20} />} label="관리자 설정" onClick={() => onNavigate('admin')} collapsed={isCollapsed} />
          <MenuItem active={currentView === 'settings'} icon={<Settings size={20} />} label="환경 설정" onClick={() => onNavigate('settings')} collapsed={isCollapsed} />
          <li className="logout" onClick={handleLogout}>
            <LogOut size={20} />
            {!isCollapsed && <span>로그아웃</span>}
          </li>
        </ul>
        <div className="user-profile">
          <div className="avatar">{userName[0]}</div>
          {!isCollapsed && (
            <div className="user-info">
              <span className="name">{userName} 님</span>
              <span className="role">컨설턴트</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
