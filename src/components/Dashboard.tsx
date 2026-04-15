import React, { useState, useEffect } from 'react';
import { Search, Bell, UserPlus, ArrowRight, BookOpen, Clock, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

interface DashboardProps {
  onSelectStudent: (studentId: string, studentName: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectStudent }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'미등록' | '수강생' | '미수강'>('수강생');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', school: '', grade: '' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setStudents(data);
    } else {
      console.error("학생 목록 로드 에러 (SQL 업데이트 전일 수 있음):", error);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.school || !newStudent.grade) {
      alert("모든 필드를 입력해주세요!");
      return;
    }
    const { error } = await supabase.from('students').insert([{
      name: newStudent.name,
      school: newStudent.school,
      grade: newStudent.grade,
      enrollment_status: '미등록'
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewStudent({ name: '', school: '', grade: '' });
      fetchStudents();
      setActiveTab('미등록');
    } else {
      alert("DB 저장 에러. Supabase SQL을 아직 실행하지 않으셨나요?\n" + error.message);
    }
  };

  const changeStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('students').update({ enrollment_status: newStatus }).eq('id', id);
    if (!error) fetchStudents();
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
            <UserPlus size={18} /><span>빠른 약식 등록 (가망 고객)</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="student-list-section glass-panel" style={{ minHeight: '600px' }}>
          
          <div className="crm-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
             <button className={`tab-btn ${activeTab === '미등록' ? 'active' : ''}`} onClick={() => setActiveTab('미등록')} style={activeTab === '미등록' ? { borderBottom: '2px solid #3b82f6', color: '#60a5fa' } : {}}>
               <Clock size={16} /> 미등록 (상담 대기열)
             </button>
             <button className={`tab-btn ${activeTab === '수강생' ? 'active' : ''}`} onClick={() => setActiveTab('수강생')} style={activeTab === '수강생' ? { borderBottom: '2px solid #10b981', color: '#10b981' } : {}}>
               <BookOpen size={16} /> 등록/수강생 (활성원생)
             </button>
             <button className={`tab-btn ${activeTab === '미수강' ? 'active' : ''}`} onClick={() => setActiveTab('미수강')} style={activeTab === '미수강' ? { borderBottom: '2px solid #9ca3af', color: '#9ca3af' } : {}}>
               <Search size={16} /> 미수강 (수강종료/이탈)
             </button>
          </div>

          <table className="student-table">
            <thead>
              <tr>
                <th>상태</th>
                <th>이름 (학교/학년)</th>
                <th>가입일/최초상담일</th>
                <th>상태 변경 전환</th>
                <th>생기부 기록/조회 진입</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    등록된 목록이 없습니다.
                  </td>
                </tr>
              )}
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                   <td>
                     <span className={`status-badge ${activeTab === '수강생' ? 'success' : activeTab === '미등록' ? 'warning' : 'danger'}`}>
                       {activeTab}
                     </span>
                   </td>
                   <td>
                     <div className="student-name">
                       <strong>{student.name}</strong>
                       <span>{student.school} {student.grade || ''}학년</span>
                     </div>
                   </td>
                   <td>{new Date(student.created_at).toLocaleDateString()}</td>
                   <td>
                      {activeTab === '미등록' && <button className="btn-secondary small" onClick={() => changeStatus(student.id, '수강생')}>정규 수강생으로 승급</button>}
                      {activeTab === '수강생' && <button className="btn-secondary small" onClick={() => changeStatus(student.id, '미수강')} style={{borderColor: '#6b7280', color: '#9ca3af'}}>수강 종료 처리</button>}
                      {activeTab === '미수강' && <button className="btn-secondary small" onClick={() => changeStatus(student.id, '수강생')}>다시 등원시키기</button>}
                   </td>
                   <td>
                     <button className="action-btn" onClick={() => onSelectStudent(student.id, student.name)}>
                       <span>학생 폴더 열기 (생기부)</span><ArrowRight size={16} />
                     </button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
           <div className="glass-panel" style={{ width: '400px', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>신규 가망/상담 고객 생성</h3>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#cbd5e1' }}>학생 이름</label>
                  <input type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #475569', color: 'white', borderRadius: '6px' }} placeholder="예: 홍길동" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#cbd5e1' }}>학교명</label>
                  <input type="text" value={newStudent.school} onChange={e => setNewStudent({...newStudent, school: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #475569', color: 'white', borderRadius: '6px' }} placeholder="예: 경기외고" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#cbd5e1' }}>학년 (숫자만)</label>
                  <input type="text" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #475569', color: 'white', borderRadius: '6px' }} placeholder="예: 2" />
                </div>
                
                <button className="btn-primary" onClick={handleCreateStudent} style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                  <Save size={18}/> 깡통 폴더 즉시 생성 (미등록 상태)
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
