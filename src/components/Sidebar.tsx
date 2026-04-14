import React from 'react';
import { 
  LineChart, 
  Users, 
  FileText, 
  MessageSquare,
  Settings,
  LogOut,
  Building,
  Calendar
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
            <span>수강생 관리</span>
          </li>
          <li className={currentView === 'student' ? 'active' : ''} onClick={() => onNavigate('student')}>
            <FileText size={20} />
            <span>생기부 분석</span>
          </li>
          <li className={currentView === 'coaching' ? 'active' : ''} onClick={() => onNavigate('coaching')}>
            <MessageSquare size={20} />
            <span>탐구 코칭</span>
            <span className="badge">3</span>
          </li>
          <li className={currentView === 'admin' ? 'active' : ''} onClick={() => onNavigate('admin')}>
            <Building size={20} />
            <span>컨설턴트/학생 매칭</span>
          </li>
          <li className={currentView === 'planner' ? 'active' : ''} onClick={() => onNavigate('planner')}>
            <Calendar size={20} />
            <span>상담 일지 & 출력</span>
          </li>
          <li>
            <LineChart size={20} />
            <span>리포트 통계</span>
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
