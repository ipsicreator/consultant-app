import React, { useState } from 'react';
import { UserPlus, ArrowRightLeft, Shield, Search, MoreHorizontal } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [consultants] = useState([
    { id: 1, name: '크리스 대표', role: '수석 컨설턴트', students: 24, status: '활성' },
    { id: 2, name: '이현정', role: '일반 컨설턴트', students: 12, status: '활성' },
    { id: 3, name: '박민수', role: '일반 컨설턴트', students: 8, status: '휴직' },
  ]);

  return (
    <div className="admin-dashboard">
      <div className="admin-header glass-panel">
        <div className="title-area">
          <Shield size={24} className="title-icon" />
          <h2>컨설턴트 및 원생 매칭 관리 (마스터 뷰)</h2>
        </div>
        <div className="admin-actions">
          <button className="btn-primary">
            <UserPlus size={18} />
            <span>신규 컨설턴트 등록</span>
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="consultant-list-section glass-panel">
          <div className="section-toolbar">
            <div className="search-bar small">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="컨설턴트명 검색..." />
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>컨설턴트 명 / 직급</th>
                <th>상태</th>
                <th>배정된 학생 수</th>
                <th>매칭 관리</th>
                <th>권한 설정</th>
              </tr>
            </thead>
            <tbody>
              {consultants.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="c-name">
                      <strong>{c.name}</strong>
                      <span>{c.role}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${c.status === '활성' ? 'success' : 'warning'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div className="student-count">
                      <strong>{c.students}</strong> 명
                    </div>
                  </td>
                  <td>
                    <button className="btn-secondary small flex-center">
                      <ArrowRightLeft size={16} />
                      원생 할당/변경
                    </button>
                  </td>
                  <td>
                    <button className="icon-btn secondary outline">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="matching-panel glass-panel">
          <div className="panel-header">
            <h3><ArrowRightLeft size={18} /> 빠른 원생 매칭 (드래그 앤 드롭)</h3>
          </div>
          <div className="matching-workspace">
            <div className="pool-col">
              <h4>미배정 신규 원생 (대기열)</h4>
              <div className="drag-item">이지훈 (휘문고 1학년) - 의예과 지망</div>
              <div className="drag-item">최윤서 (숙명여고 2학년) - 경영학과 지망</div>
            </div>
            <div className="pool-col">
              <h4>크리스 대표 (수석) 배정 목록</h4>
              <div className="drag-item assigned">김지민 (서울과학고 2학년)</div>
              <div className="drag-item assigned">박서연 (강남고 1학년)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
