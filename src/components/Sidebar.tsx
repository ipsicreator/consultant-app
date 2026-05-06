import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Settings,
  LogOut,
  Building,
  Calendar,
  Lightbulb,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        if (profile?.name) setUserName(profile.name);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">S</div>
          {!isCollapsed && <span className="brand-name">SUPREMA</span>}
        </div>
        {!isCollapsed && <p className="subtitle">AI 생기부 관리 마스터</p>}
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
            {!isCollapsed && <span>생기부 AI 분석</span>}
          </li>
          <li className={currentView === 'exploration' ? 'active' : ''} onClick={() => onNavigate('exploration')}>
            <Lightbulb size={20} />
            {!isCollapsed && (
              <>
                <span>AI 탐구 브레인</span>
                <span className="badge">New</span>
              </>
            )}
          </li>
          <li className={currentView === 'planner' ? 'active' : ''} onClick={() => onNavigate('planner')}>
            <Calendar size={20} />
            {!isCollapsed && <span>학습/입시 플래너</span>}
          </li>
          <li className={currentView === 'admin' ? 'active' : ''} onClick={() => onNavigate('admin')}>
            <Building size={20} />
            {!isCollapsed && <span>팀원 배정 관리</span>}
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul>
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
              <span className="role">전문 컨설턴트</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
