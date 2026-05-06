import React, { useState, useEffect } from 'react';
import { UserPlus, ArrowRightLeft, Shield, Search, MoreHorizontal, Users, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('academy_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.academy_id) {
          setAcademyId(profile.academy_id);
          // 학원 소속 컨설턴트 목록 가져오기
          const { data: staff } = await supabase
            .from('profiles')
            .select('*')
            .eq('academy_id', profile.academy_id)
            .eq('role', 'consultant');
          
          if (staff) setConsultants(staff);
        }
      }
      setLoading(false);
    };
    fetchAdminData();
  }, []);

  return (
    <div className="admin-dashboard fade-in">
      <header className="admin-header glass-panel">
        <div className="title-area">
          <Shield size={24} className="title-icon" />
          <h2>학원 운영 및 컨설턴트 관리</h2>
        </div>
        <div className="admin-actions">
          <button className="btn-primary">
            <UserPlus size={18} />
            <span>신규 컨설턴트 초대</span>
          </button>
        </div>
      </header>

      <div className="admin-content-grid">
        {/* 컨설턴트 현황 섹션 */}
        <div className="consultant-list-section glass-panel">
          <div className="section-header">
            <div className="header-left">
              <Users size={20} />
              <h3>소속 컨설턴트 현황</h3>
            </div>
            <div className="search-bar small">
              <Search size={16} />
              <input type="text" placeholder="성함으로 검색..." />
            </div>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>컨설턴트 성함</th>
                  <th>이메일</th>
                  <th>관리 학생 수</th>
                  <th>상태</th>
                  <th>권한</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-state">로딩 중...</td></tr>
                ) : consultants.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">등록된 컨설턴트가 없습니다.</td></tr>
                ) : (
                  consultants.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="c-name">
                          <strong>{c.name || '이름 미설정'}</strong>
                          <span>{c.role === 'consultant' ? '일반 컨설턴트' : '부원장'}</span>
                        </div>
                      </td>
                      <td>{c.email}</td>
                      <td>
                        <div className="student-count">
                          <strong>{Math.floor(Math.random() * 20)}</strong> 명
                        </div>
                      </td>
                      <td>
                        <span className="status-badge success">활동 중</span>
                      </td>
                      <td>
                        <button className="icon-btn secondary outline">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 빠른 배정 패널 */}
        <div className="matching-panel glass-panel">
          <div className="panel-header">
            <h3><ArrowRightLeft size={18} /> 학생-컨설턴트 빠른 매칭</h3>
          </div>
          <div className="matching-workspace">
            <div className="pool-col">
              <h4>미배정 신규 학생</h4>
              <div className="drag-item">이강인 (미래고 1학년)</div>
              <div className="drag-item">손흥민 (토트넘고 2학년)</div>
            </div>
            <div className="pool-arrow">
              <ArrowRightLeft size={24} />
            </div>
            <div className="pool-col">
              <h4>담당 컨설턴트 선택</h4>
              <div className="consultant-select-item">
                <UserCheck size={16} />
                <span>이리나 팀장 (배정: 12명)</span>
              </div>
              <div className="consultant-select-item">
                <UserCheck size={16} />
                <span>김현우 컨설턴트 (배정: 8명)</span>
              </div>
            </div>
          </div>
          <button className="btn-primary full-width mt-20">
            매칭 설정 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
