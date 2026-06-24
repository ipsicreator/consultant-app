import React, { useEffect, useState } from 'react';
import {
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { pb } from '../lib/pocketbase';
import './Sidebar.css';

interface SidebarProps {
  currentView: 'dashboard' | 'student' | 'exploration' | 'admin' | 'planner' | 'settings';
  onNavigate: (view: 'dashboard' | 'student' | 'exploration' | 'admin' | 'planner' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const [userName, setUserName] = useState('컨설턴트');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (pb.authStore.isValid && pb.authStore.model) {
        const user = pb.authStore.model;
        try {
          const profile = await pb.collection('profiles').getOne(user.id);
          if (profile?.name) setUserName(profile.name);
        } catch (error) {
          console.error('Sidebar fetch user error:', error);
        }
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      pb.authStore.clear();
      window.location.reload();
    }
  };

  return (
    <div className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">G</div>
          {!isCollapsed && <span className="brand-name">교과세특전문가</span>}
        </div>
        {!isCollapsed && <p className="subtitle">학생부 분석 시스템</p>}
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
            {!isCollapsed && <span>학생부 AI 분석</span>}
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
            {!isCollapsed && <span>운영 관리</span>}
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul>
          <li className={currentView === 'settings' ? 'active' : ''} onClick={() => onNavigate('settings')}>
            <Settings size={20} />
            {!isCollapsed && <span>설정</span>}
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
              <span className="name">{userName}</span>
              <span className="role">분석 컨설턴트</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
