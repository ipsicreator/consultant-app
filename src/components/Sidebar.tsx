import React, { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  Settings,
  LogOut,
  Building,
  Calendar,
  Lightbulb,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { pb } from '../lib/pocketbase';
import { resolveOrCreateProfile } from '../lib/profileLink';
import './Sidebar.css';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const [userName, setUserName] = useState('컨설턴트');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!pb.authStore.isValid || !pb.authStore.model) return;
      const user = pb.authStore.model as any;
      try {
        const profile = await resolveOrCreateProfile();
        if (profile?.name) setUserName(profile.name);
        else if (user?.email) setUserName(String(user.email).split('@')[0]);
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
            <img src="/logo.png" alt="수프리마 플랫폼" className="brand-logo" />
          )}
        </div>
        {!isCollapsed && <p className="subtitle" style={{ textAlign: 'center', width: '100%', display: 'block' }}>교과·탐구 세특 코칭 플랫폼</p>}
        <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li className={currentView === 'dashboard' ? 'active' : ''} onClick={() => onNavigate('dashboard')}>
            <Users size={20} />
            {!isCollapsed && <span>학생 CRM 관리</span>}
          </li>
          <li className={currentView === 'student' ? 'active' : ''} onClick={() => onNavigate('student')}>
            <FileText size={20} />
            {!isCollapsed && <span>학생부/성적분석</span>}
          </li>
          <li className={currentView === 'exploration' ? 'active' : ''} onClick={() => onNavigate('exploration')}>
            <Lightbulb size={20} />
            {!isCollapsed && <span>주제탐구활동</span>}
          </li>
          <li className={currentView === 'inquiry_guide' ? 'active' : ''} onClick={() => onNavigate('inquiry_guide')}>
            <BookOpen size={20} />
            {!isCollapsed && <span>심화탐구가이드</span>}
          </li>
          <li className={currentView === 'planner' ? 'active' : ''} onClick={() => onNavigate('planner')}>
            <Calendar size={20} />
            {!isCollapsed && <span>학습/입시 설계</span>}
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul>
          <li className={currentView === 'admin' ? 'active' : ''} onClick={() => onNavigate('admin')}>
            <Building size={20} />
            {!isCollapsed && <span>관리자 배정 관리</span>}
          </li>
          <li className={currentView === 'settings' ? 'active' : ''} onClick={() => onNavigate('settings')}>
            <Settings size={20} />
            {!isCollapsed && <span>환경 설정</span>}
          </li>
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
              <span className="role">입시 컨설턴트</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
