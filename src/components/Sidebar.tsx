import React from 'react';
import { 
  Users, 
  FileText, 
  Settings,
  LogOut,
  Building,
  Calendar,
  Lightbulb
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.png" alt="대치수프리마 로고" className="brand-logo" />
        </div>
        <p className="subtitle">AI_학생부관리전문가1.0</p>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li className={currentView === 'dashboard' ? 'active' : ''} onClick={() => onNavigate('dashboard')}>
            <Users size={20} />
            <span>학생 CRM 관리 (등록/분류)</span>
          </li>
          <li className={currentView === 'student' ? 'active' : ''} onClick={() => onNavigate('student')}>
            <FileText size={20} />
            <span>빠른 생기부 스캔 (미등록)</span>
          </li>
          <li className={currentView === 'exploration' ? 'active' : ''} onClick={() => onNavigate('exploration')}>
            <Lightbulb size={20} />
            <span>탐구/수행평가 (AI 브레인)</span>
            <span className="badge">N</span>
          </li>
          <li className={currentView === 'planner' ? 'active' : ''} onClick={() => onNavigate('planner')}>
            <Calendar size={20} />
            <span>종합 보고서 인쇄소</span>
          </li>
          <li className={currentView === 'admin' ? 'active' : ''} onClick={() => onNavigate('admin')}>
            <Building size={20} />
            <span>컨설턴트 등록/배정</span>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul>
          <li className={currentView === 'settings' ? 'active' : ''} onClick={() => onNavigate('settings')}>
            <Settings size={20} />
            <span>설정</span>
          </li>
          <li className="logout">
            <LogOut size={20} />
            <span>로그아웃</span>
          </li>
        </ul>
        <div className="user-profile">
          <div className="avatar">원</div>
          <div className="user-info">
            <span className="name">총괄 원장님</span>
            <span className="role">대치수프리마 마스터</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
