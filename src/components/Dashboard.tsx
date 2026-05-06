import React, { useState, useEffect } from 'react';
import { Search, Bell, UserPlus, ArrowRight, BookOpen, Clock, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

interface Student {
  id: string;
  name: string;
  school: string;
  grade: string;
  enrollment_status: string;
  created_at: string;
  academy_id: string;
}

interface DashboardProps {
  onSelectStudent: (id: string, name: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectStudent }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState('미등록');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({ name: '', school: '', grade: '' });
  const [academyId, setAcademyId] = useState<string | null>(null);

  useEffect(() => {
    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 프로필에서 학원 ID 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('academy_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.academy_id) {
          setAcademyId(profile.academy_id);
          fetchStudents(profile.academy_id);
        }
      }
    };
    initDashboard();
  }, []);

  const fetchStudents = async (id: string = academyId || '') => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('academy_id', id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStudents(data);
    }
    setLoading(false);
  };

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.school || !newStudent.grade || !academyId) {
      alert("모든 필드를 입력해 주세요!");
      return;
    }
    
    const { error } = await supabase.from('students').insert([{
      name: newStudent.name,
      school: newStudent.school,
      grade: newStudent.grade,
      enrollment_status: '미등록',
      academy_id: academyId
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewStudent({ name: '', school: '', grade: '' });
      fetchStudents(academyId);
      setActiveTab('미등록');
    } else {
      alert("등록 실패: " + error.message);
    }
  };

  const changeStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('students')
      .update({ enrollment_status: newStatus })
      .eq('id', id);
    if (!error) fetchStudents(academyId!);
  };

  const filteredStudents = students.filter(s => (s.enrollment_status || '미등록') === activeTab);

  return (
    <div className="dashboard">
      <header className="dashboard-header glass-panel">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="학생 이름, 학교 검색..." />
        </div>
        <div className="header-actions">
          <button className="icon-btn"><Bell size={20} /><span className="notification-dot"></span></button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} /><span>신규 가망 고객 등록</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="student-list-section glass-panel">
          <div className="crm-tabs">
             <button className={`tab-btn ${activeTab === '미등록' ? 'active' : ''}`} onClick={() => setActiveTab('미등록')}>
               <Clock size={16} /> 미등록 (상담 대기)
             </button>
             <button className={`tab-btn ${activeTab === '수강중' ? 'active' : ''}`} onClick={() => setActiveTab('수강중')}>
               <BookOpen size={16} /> 등록/수강중 (활성)
             </button>
             <button className={`tab-btn ${activeTab === '종료' ? 'active' : ''}`} onClick={() => setActiveTab('종료')}>
               <X size={16} /> 수강종료/이탈
             </button>
          </div>

          <div className="table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>학생 정보</th>
                  <th>등록일</th>
                  <th>상태 변경</th>
                  <th>상세 관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-state">데이터를 불러오는 중...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">해당 탭에 등록된 학생이 없습니다.</td></tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="fade-in">
                       <td>
                         <span className={`status-badge ${activeTab === '수강중' ? 'success' : activeTab === '미등록' ? 'warning' : 'neutral'}`}>
                           {activeTab}
                         </span>
                       </td>
                       <td>
                         <div className="student-name">
                           <strong>{student.name}</strong>
                           <span>{student.school} | {student.grade}학년</span>
                         </div>
                       </td>
                       <td>{new Date(student.created_at).toLocaleDateString()}</td>
                       <td>
                          <div className="status-actions">
                            {activeTab === '미등록' && <button className="btn-mini success" onClick={() => changeStatus(student.id, '수강중')}>수강 등록</button>}
                            {activeTab === '수강중' && <button className="btn-mini neutral" onClick={() => changeStatus(student.id, '종료')}>수강 종료</button>}
                            {activeTab === '종료' && <button className="btn-mini warning" onClick={() => changeStatus(student.id, '수강중')}>다시 등록</button>}
                          </div>
                       </td>
                       <td>
                         <button className="action-btn" onClick={() => onSelectStudent(student.id, student.name)}>
                           <span>기록 및 분석 진입</span><ArrowRight size={16} />
                         </button>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
           <div className="modal-content glass-panel animate-pop">
              <div className="modal-header">
                <h3>신규 가망 고객 등록</h3>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>학생 이름</label>
                  <input type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} placeholder="예: 홍길동" />
                </div>
                <div className="form-group">
                  <label>학교명</label>
                  <input type="text" value={newStudent.school} onChange={e => setNewStudent({...newStudent, school: e.target.value})} placeholder="예: 수프리마고등학교" />
                </div>
                <div className="form-group">
                  <label>학년</label>
                  <select value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})}>
                    <option value="">학년 선택</option>
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                  </select>
                </div>
                
                <button className="btn-primary full-width" onClick={handleCreateStudent}>
                  <Save size={18}/> 학생 등록 (미등록 상태)
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
