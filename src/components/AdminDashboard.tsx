import { useEffect, useState } from 'react';
import { Users, Shield, Search, Database } from 'lucide-react';
import { pb } from '../lib/pocketbase';
import { requireAcademyScope, scopedStudents } from '../lib/profileLink';
import { canManageAcademy, filterValue } from '../lib/academyScope';
import { SUPREMA_LAB_URL } from '../lib/lab';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [staff, setStaff] = useState<any[]>([]), [students, setStudents] = useState<any[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [search, setSearch] = useState('');
  useEffect(() => { let active = true; const load = async () => { try {
    const scope = await requireAcademyScope(); if (!canManageAcademy(scope)) throw new Error('학원 관리자만 이용할 수 있습니다.');
    const [profiles, pupils] = await Promise.all([pb.collection('suprima_profiles').getFullList({ filter: 'academy_id=' + filterValue(scope.academyId) }), scopedStudents()]);
    if (profiles.some(profile => profile.academy_id !== scope.academyId)) throw new Error('학원 자료 범위를 확인해 주세요.');
    if (active) { setStaff(profiles); setStudents(pupils); }
  } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : '학원 정보를 불러오지 못했습니다.'); } finally { if (active) setLoading(false); } }; void load(); return () => { active = false; }; }, []);
  const assignmentField = import.meta.env.VITE_STUDENT_CONSULTANT_FIELD;
  const count = (id: string) => assignmentField && /^[a-z][a-z0-9_]*$/i.test(assignmentField) ? students.filter(student => student[assignmentField] === id || (Array.isArray(student[assignmentField]) && student[assignmentField].includes(id))).length : '—';
  return <div className="admin-dashboard fade-in">
    <header className="admin-header glass-panel"><div className="header-left"><Shield className="accent-color" size={24}/><div className="title-area"><h2>수프리마 랩 · 학원 관리자</h2><p>소속 담당 컨설턴트와 학생 현황을 확인합니다.</p></div></div></header>
    {error && <p role="alert">{error}</p>}
    <div className="admin-grid"><section className="staff-section glass-panel"><div className="section-title"><div className="title-left"><Users size={20}/><h3>소속 컨설턴트</h3></div><div className="search-bar-small"><Search size={16}/><input aria-label="담당자 검색" placeholder="이름 검색..." value={search} onChange={event => setSearch(event.target.value)}/></div></div>
      <p>계정 등록·소속 변경은 본사 관리자에게 요청해 주세요.</p><div className="staff-list">{loading ? <p role="status">학원 정보를 확인하고 있습니다.</p> : staff.filter(member => String(member.name || member.full_name || '').includes(search)).map(member => <div key={member.id} className="staff-card"><div className="member-info"><div className="avatar-med">{(member.name || member.full_name || '담')[0]}</div><div className="details"><h4>{member.name || member.full_name || '이름 미등록'}</h4><div className="role-badge">{member.role === 'consultant' ? '담당 컨설턴트' : member.role === 'admin' ? '학원 관리자' : member.role === 'master' ? '마스터' : '역할 확인 필요'}</div></div></div><div className="member-stats"><span>배정 학생 {count(member.id)}</span></div></div>)}</div>
      {!loading && !error && !staff.length && <p>등록된 소속 담당자가 없습니다.</p>}
    </section><section className="admin-stats glass-panel"><div className="section-title"><Database size={20}/><h3>공통 입시 자료</h3></div><p>입시 파일은 수프리마 랩에서 검증·반영하며 학원용 앱은 같은 자료를 조회합니다.</p><a href={SUPREMA_LAB_URL + '/admin/admissions'} target="_blank" rel="noreferrer" className="btn-primary">공통 자료 관리 열기</a>{!loading && !error && <p>학원 학생 {students.length}명</p>}{!assignmentField && <p>담당 학생 배정 관계 설정 후 담당자별 인원과 접근 권한이 적용됩니다.</p>}</section></div>
  </div>;
}
