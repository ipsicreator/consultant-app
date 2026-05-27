import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings,
  Mail,
  MoreVertical,
  Search,
  Save,
  Map
} from 'lucide-react';
import { pb } from '../lib/pocketbase';
import { DEFAULT_CATEGORY_MAP, SUBJECTS, GLOBAL_MAP_ID } from '../lib/explorationConfig';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Exploration Map Editor State
  const [mapData, setMapData] = useState<Record<string, { title: string; subtitle: string; desc: string }[]>>({});
  const [activeSubject, setActiveSubject] = useState('과학');
  const [isSaving, setIsSaving] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
    fetchMapData();
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

  const fetchMapData = async () => {
    try {
      const records = await pb.collection('suprima_pdf_analyses').getList(1, 1, {
        filter: `student_id="${GLOBAL_MAP_ID}"`
      });
      if (records.items.length > 0) {
        setRecordId(records.items[0].id);
        const savedMap = records.items[0].content as Record<string, any>;
        setMapData({ ...DEFAULT_CATEGORY_MAP, ...savedMap });
      } else {
        setMapData({ ...DEFAULT_CATEGORY_MAP });
      }
    } catch (err) {
      console.error('Map fetch error:', err);
      setMapData({ ...DEFAULT_CATEGORY_MAP });
    }
  };

  const saveMapData = async () => {
    setIsSaving(true);
    try {
      if (recordId) {
        await pb.collection('suprima_pdf_analyses').update(recordId, {
          content: mapData
        });
      } else {
        const record = await pb.collection('suprima_pdf_analyses').create({
          student_id: GLOBAL_MAP_ID,
          content: mapData
        });
        setRecordId(record.id);
      }
      alert('탐구 맵핑 카드가 성공적으로 저장되어 전체 화면에 반영되었습니다.');
    } catch (err) {
      console.error('Map save error:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCardChange = (idx: number, field: 'title' | 'subtitle' | 'desc', value: string) => {
    setMapData(prev => {
      const newData = { ...prev };
      if (!newData[activeSubject]) {
        newData[activeSubject] = DEFAULT_CATEGORY_MAP['과학'].map(c => ({...c, title: c.title, subtitle: '', desc: ''}));
      }
      newData[activeSubject][idx] = { ...newData[activeSubject][idx], [field]: value };
      return newData;
    });
  };

  const currentCards = mapData[activeSubject] || DEFAULT_CATEGORY_MAP['과학'].map(c => ({...c, subtitle: '', desc: ''}));

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
            <div className="title-left">
              <Map size={20} />
              <h3>탐구 맵핑 카드 대표 샘플 관리 (마스터)</h3>
            </div>
            <button className="btn-primary" onClick={saveMapData} disabled={isSaving} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
              <Save size={16} /> {isSaving ? '저장 중...' : '전체 저장 (배포)'}
            </button>
          </div>
          
          <div className="map-editor-section">
            <div className="subject-tabs-admin">
              {SUBJECTS.map(sub => (
                <button 
                  key={sub} 
                  className={`admin-sub-tab ${activeSubject === sub ? 'active' : ''}`}
                  onClick={() => setActiveSubject(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>

            <p className="editor-hint">
              <strong>{activeSubject}</strong> 과목의 탐구 맵핑 카드(6개 영역)에 노출될 샘플을 수정합니다. 저장 시 모든 컨설턴트의 <strong>[탐구활동 제안]</strong> 탭에 즉시 반영됩니다.
            </p>

            <div className="map-editor-grid">
              {currentCards.map((card, idx) => (
                <div key={idx} className="map-editor-card">
                  <div className="card-header-admin">
                    <span className="idx-badge">{idx + 1}</span>
                    <input 
                      type="text" 
                      className="edit-title" 
                      value={card.title} 
                      onChange={(e) => handleCardChange(idx, 'title', e.target.value)}
                      placeholder="분류 (예: 기초)"
                    />
                  </div>
                  <div className="card-body-admin">
                    <label>대표 과목/주제</label>
                    <input 
                      type="text" 
                      className="edit-subtitle" 
                      value={card.subtitle} 
                      onChange={(e) => handleCardChange(idx, 'subtitle', e.target.value)}
                      placeholder="예: 통합과학1·2"
                    />
                    <label>상세 설명 (탐구 관점)</label>
                    <textarea 
                      className="edit-desc" 
                      value={card.desc} 
                      onChange={(e) => handleCardChange(idx, 'desc', e.target.value)}
                      placeholder="이 영역의 목적과 탐구 방향성을 설명해주세요."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
