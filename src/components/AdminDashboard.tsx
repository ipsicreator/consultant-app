import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings,
  Mail,
  MoreVertical,
  Search
} from 'lucide-react';
import { pb } from '../lib/pocketbase';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const records = await pb.collection('suprima_profiles').getFullList();
      setStaff(records);
    } catch (err) {
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard fade-in">
      <header className="admin-header glass-panel">
        <div className="header-left">
          <Shield className="accent-color" size={24} />
          <div className="title-area">
            <h2>학원 관리자 센터</h2>
            <p>소속 컨설턴트 및 학생 배정 현황을 관리합니다.</p>
          </div>
        </div>
        <button className="btn-primary">
          <UserPlus size={18} />
          <span>컨설턴트 등록</span>
        </button>
      </header>

      <div className="admin-grid">
        <section className="staff-section glass-panel">
          <div className="section-title">
            <div className="title-left">
              <Users size={20} />
              <h3>소속 컨설턴트 관리</h3>
            </div>
            <div className="search-bar-small">
              <Search size={16} />
              <input type="text" placeholder="이름 검색..." />
            </div>
          </div>

          <div className="staff-list">
            {loading ? (
              <div className="loading-staff">데이터 로드 중...</div>
            ) : (
              staff.map((member) => (
                <div key={member.id} className="staff-card">
                  <div className="member-info">
                    <div className="avatar-med">{member.full_name?.[0] || 'U'}</div>
                    <div className="details">
                      <h4>{member.full_name || '이름 없음'}</h4>
                      <div className="role-badge">{member.role}</div>
                    </div>
                  </div>
                  <div className="member-stats">
                    <div className="stat">
                      <span className="label">학생</span>
                      <span className="value">12</span>
                    </div>
                  </div>
                  <div className="member-actions">
                    <button className="icon-btn"><Mail size={18} /></button>
                    <button className="icon-btn"><Settings size={18} /></button>
                    <button className="icon-btn"><MoreVertical size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="admin-stats glass-panel">
          <div className="section-title">
            <Settings size={20} />
            <h3>학원 운영 통계</h3>
          </div>
          <div className="stats-placeholder">
            <p>준비 중인 기능입니다.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
