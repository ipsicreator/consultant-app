import { useCallback, useEffect, useRef, useState } from 'react';
import { Users, Shield, Search, Database, Save, RefreshCw } from 'lucide-react';
import { pb } from '../lib/pocketbase';
import { requireAcademyScope } from '../lib/profileLink';
import { canManageAcademy } from '../lib/academyScope';
import { readAssignments, saveAssignment, type AssignmentConsultant, type AssignmentStudent } from '../lib/assignments';
import { SUPREMA_LAB_URL } from '../lib/lab';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [staff, setStaff] = useState<AssignmentConsultant[]>([]), [students, setStudents] = useState<AssignmentStudent[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [search, setSearch] = useState(''), [studentSearch, setStudentSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { consultantId: string; expectedUpdated: string }>>({}), [busy, setBusy] = useState<Set<string>>(new Set());
  const alive = useRef(false), generation = useRef(0), requestSequence = useRef(0), busyRows = useRef(new Set<string>());

  const refresh = useCallback(async (savedStudentId?: string, resetDrafts = false) => {
    const activeGeneration = generation.current, sequence = ++requestSequence.current;
    const scope = await requireAcademyScope();
    if (!canManageAcademy(scope)) throw new Error('학원 관리자만 이용할 수 있습니다.');
    const roster = await readAssignments();
    if (!alive.current || generation.current !== activeGeneration || sequence !== requestSequence.current) return;
    setStaff(roster.consultants); setStudents(roster.students);
    setDrafts(previous => Object.fromEntries(roster.students.map(student => [student.id, !resetDrafts && student.id !== savedStudentId && Object.hasOwn(previous, student.id) ? previous[student.id] : { consultantId: student.assigned_consultant, expectedUpdated: student.updated }])));
  }, []);

  useEffect(() => {
    alive.current = true;
    const activeGeneration = ++generation.current;
    const unsubscribe = pb.authStore.onChange(() => {
      generation.current++; requestSequence.current++; busyRows.current.clear();
      setStaff([]); setStudents([]); setDrafts({}); setBusy(new Set()); setNotice(''); setLoading(false);
      setError('로그인 정보가 변경되었습니다. 학원 관리자 화면을 다시 열어 주세요.');
    });
    void refresh().catch(reason => {
      if (alive.current && generation.current === activeGeneration) setError(reason instanceof Error ? reason.message : '학원 정보를 불러오지 못했습니다.');
    }).finally(() => { if (alive.current && generation.current === activeGeneration) setLoading(false); });
    return () => { alive.current = false; generation.current++; unsubscribe(); };
  }, [refresh]);

  const save = async (student: AssignmentStudent) => {
    if (busyRows.current.has(student.id)) return;
    const draft = drafts[student.id] ?? { consultantId: student.assigned_consultant, expectedUpdated: student.updated };
    const consultantId = draft.consultantId;
    if (consultantId && !staff.some(member => member.id === consultantId)) { setError('소속 담당자를 다시 선택해 주세요.'); return; }
    const activeGeneration = generation.current;
    busyRows.current.add(student.id); setBusy(new Set(busyRows.current)); setError(''); setNotice('');
    let persisted = false;
    try {
      await saveAssignment(student.id, consultantId, draft.expectedUpdated);
      persisted = true;
      if (!alive.current || generation.current !== activeGeneration) return;
      await refresh(student.id);
      if (alive.current && generation.current === activeGeneration) setNotice('학생 배정을 저장했습니다.');
    } catch (reason) {
      if (alive.current && generation.current === activeGeneration) setError(persisted ? '배정은 저장됐지만 최신 목록을 불러오지 못했습니다. 새로고침으로 결과를 확인해 주세요.' : reason instanceof Error ? reason.message : '학생 배정을 저장하지 못했습니다.');
    } finally {
      if (alive.current && generation.current === activeGeneration) { busyRows.current.delete(student.id); setBusy(new Set(busyRows.current)); }
    }
  };
  const reload = async () => {
    if (loading || busyRows.current.size) return;
    const activeGeneration = generation.current;
    setLoading(true); setError(''); setNotice('');
    try { await refresh(undefined, true); }
    catch (reason) { if (alive.current && generation.current === activeGeneration) setError(reason instanceof Error ? reason.message : '학생 배정을 불러오지 못했습니다.'); }
    finally { if (alive.current && generation.current === activeGeneration) setLoading(false); }
  };

  return <div className="admin-dashboard fade-in">
    <header className="admin-header glass-panel"><div className="header-left"><Shield className="accent-color" size={24}/><div className="title-area"><h2>수프리마 랩 · 학원 관리자</h2><p>소속 실행 담당자와 학생 배정을 관리합니다.</p></div></div></header>
    {error && <p className="assignment-error" role="alert">{error}</p>}
    {notice && <p className="assignment-notice" role="status">{notice}</p>}
    <div className="admin-grid"><section className="staff-section glass-panel"><div className="section-title"><div className="title-left"><Users size={20}/><h3>소속 실행 담당자</h3></div><div className="search-bar-small"><Search size={16}/><input aria-label="담당자 검색" placeholder="이름 검색..." value={search} onChange={event => setSearch(event.target.value)}/></div></div>
      <p>계정 등록·소속 변경은 본사 관리자에게 요청해 주세요.</p><div className="staff-list">{loading ? <p role="status">학원 정보를 확인하고 있습니다.</p> : staff.filter(member => member.name.includes(search)).map(member => <div key={member.id} className="staff-card"><div className="member-info"><div className="avatar-med">{(member.name || '담')[0]}</div><div className="details"><h4>{member.name || '이름 미등록'}</h4><div className="role-badge">담당 컨설턴트</div></div></div><div className="member-stats"><span>배정 학생 {students.filter(student => student.assigned_consultant === member.id).length}명</span></div></div>)}</div>
      {!loading && !error && !staff.length && <p>등록된 소속 담당자가 없습니다.</p>}
    </section><section className="admin-stats glass-panel"><div className="section-title"><Database size={20}/><h3>공통 입시 자료</h3></div><p>입시 파일은 수프리마 랩에서 검증·반영하며 학원용 앱은 같은 자료를 조회합니다.</p><a href={SUPREMA_LAB_URL + '/admin/admissions'} target="_blank" rel="noreferrer" className="btn-primary">공통 자료 관리 열기</a>{!loading && !error && <p>학원 학생 {students.length}명 · 미배정 {students.filter(student => !student.assigned_consultant).length}명</p>}</section></div>
    <section className="assignment-section glass-panel" aria-labelledby="student-assignment-title"><div className="section-title assignment-title"><div className="title-left"><Users size={20}/><h3 id="student-assignment-title">학생별 실행 담당자 배정</h3></div><div className="assignment-tools"><div className="search-bar-small"><Search size={16}/><input aria-label="배정할 학생 검색" placeholder="학생 이름 검색..." value={studentSearch} onChange={event => setStudentSearch(event.target.value)}/></div><button type="button" className="btn-secondary" onClick={() => void reload()} disabled={loading || busy.size > 0}><RefreshCw size={16}/>새로고침</button></div></div>
      <p>같은 학원의 담당 컨설턴트를 선택한 뒤 저장하세요. 미배정 학생은 실행 담당자가 조회할 수 없습니다.</p>
      {loading ? <p role="status">학생 배정을 불러오고 있습니다.</p> : <div className="assignment-list">{students.filter(student => student.name.includes(studentSearch)).map(student => {
        const selected = drafts[student.id]?.consultantId ?? student.assigned_consultant, known = !selected || staff.some(member => member.id === selected);
        return <div className="assignment-row" key={student.id}><strong>{student.name || '이름 미등록'}</strong><div className="assignment-controls"><select aria-label={`${student.name || '학생'} 실행 담당자`} value={selected} disabled={busy.has(student.id)} onChange={event => setDrafts(previous => ({ ...previous, [student.id]: { consultantId: event.target.value, expectedUpdated: previous[student.id]?.expectedUpdated ?? student.updated } }))}><option value="">미배정</option>{!known && <option value={selected} disabled>담당자 확인 필요</option>}{staff.map(member => <option key={member.id} value={member.id}>{member.name || '이름 미등록'}</option>)}</select><button type="button" className="btn-primary" disabled={busy.has(student.id) || selected === student.assigned_consultant || !known} onClick={() => void save(student)}><Save size={16}/>{busy.has(student.id) ? '저장 중…' : '저장'}</button></div></div>;
      })}{!students.length && !error && <p>등록된 학생이 없습니다.</p>}{students.length > 0 && !students.some(student => student.name.includes(studentSearch)) && <p>검색된 학생이 없습니다.</p>}</div>}
    </section>
  </div>;
}
