import React from 'react';
import { Search, Bell, Upload, FileBarChart, ArrowRight, UserPlus, Filter } from 'lucide-react';
import './Dashboard.css';

interface DashboardProps {
  onSelectStudent: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectStudent }) => {
  return (
    <div className="dashboard">
      <header className="dashboard-header glass-panel">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="학생 이름, 학교, 또는 생기부 키워드 검색..." />
        </div>
        <div className="header-actions">
          <button className="icon-btn">
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>
          <button className="btn-primary">
            <UserPlus size={18} />
            <span>신규 학생 등록</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="welcome-banner glass-panel">
          <div className="banner-text">
            <h2>환영합니다, 크리스 컨설턴트님 👋</h2>
            <p>오늘 확인해야 할 새로운 학생부 업데이트가 <strong>2건</strong> 대기 중입니다.</p>
          </div>
          <button className="btn-secondary">
            <Upload size={18} />
            <span>생기부 PDF 스캔 (AI 해독)</span>
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8' }}>
              <Users size={24} />
            </div>
            <div className="stat-info">
              <h3>총 관리 학생</h3>
              <p className="value">24<span className="unit">명</span></p>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <FileBarChart size={24} />
            </div>
            <div className="stat-info">
              <h3>분석 완료 생기부</h3>
              <p className="value">18<span className="unit">건</span></p>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
              <MessageSquare size={24} />
            </div>
            <div className="stat-info">
              <h3>진행 중인 코칭</h3>
              <p className="value">7<span className="unit">건</span></p>
            </div>
          </div>
        </div>

        <div className="student-list-section glass-panel">
          <div className="section-header">
            <h3>내 관리 학생 목록</h3>
            <button className="icon-btn secondary">
              <Filter size={18} />
            </button>
          </div>
          
          <table className="student-table">
            <thead>
              <tr>
                <th>이름 (학교)</th>
                <th>목표 진로</th>
                <th>생기부 상태</th>
                <th>최근 활동 내역</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '김지민', school: '서울과학고 2학년', goal: '컴퓨터공학과', status: '분석 완료', activity: '인공지능 탐구 보고서 제출', type: 'success' },
                { name: '이도윤', school: '경기외고 3학년', goal: '경영학과', status: 'PDF 분석중', activity: '-', type: 'warning' },
                { name: '박서연', school: '강남고 1학년', goal: '의예과', status: '코칭 대기', activity: '의학 윤리 독서록 업로드', type: 'danger' }
              ].map((student, i) => (
                <tr key={i}>
                  <td>
                    <div className="student-name">
                      <strong>{student.name}</strong>
                      <span>{student.school}</span>
                    </div>
                  </td>
                  <td><span className="tag-goal">{student.goal}</span></td>
                  <td>
                    <span className={`status-badge ${student.type}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="activity-cell">{student.activity}</td>
                  <td>
                    <button className="action-btn" onClick={onSelectStudent}>
                      <span>상세보기</span>
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Temp mock for icon missing import
import { Users, MessageSquare } from 'lucide-react';

export default Dashboard;
