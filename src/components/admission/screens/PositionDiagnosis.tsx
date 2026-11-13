import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Compass, Filter, Printer, Save, Search } from 'lucide-react';
import { parseGpaTextToNumber } from '../../../utils/admission/admissionLines';
import AdmissionOfficerEvaluation from '../AdmissionOfficerEvaluation';
import { useAdmissionData } from '../data';
import { readStudentDraft } from '../../../lib/studentRecords';
import { requireStudentAccess } from '../../../lib/profileLink';
import { requestAdmissionDiagnosis } from '../../../lib/lab';

interface PositionDiagnosisProps {
  onBack?: () => void;
  studentData?: { id: string; name: string } | null;
}

export default function PositionDiagnosis({ onBack, studentData }: PositionDiagnosisProps) {
  const { rows: ADMISSION_DATA, loading: dataLoading, error: dataError } = useAdmissionData();
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSubRegion, setSelectedSubRegion] = useState('');
  const [selectedUniv, setSelectedUniv] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [hsType, setHsType] = useState('일반고');
  const [parsedGpa, setParsedGpa] = useState<number | null>(null);
  const [gradingSystem, setGradingSystem] = useState<'' | '9-level' | '5-level'>('');
  const [diagnoses, setDiagnoses] = useState<Record<string, { level?: string; reason?: string; error?: string }>>({});
  const [pending, setPending] = useState('');
  const diagnosisGeneration = useRef(0);
  useEffect(() => { let active = true; setParsedGpa(null);
    if (studentData?.id) readStudentDraft(studentData.id).then(info => { if (active) setParsedGpa(info.gpa ? parseGpaTextToNumber(info.gpa) : null); }).catch(() => { if (active) setParsedGpa(null); });
    return () => { active = false; };
  }, [studentData?.id]);
  useEffect(() => { diagnosisGeneration.current++; setDiagnoses({}); setPending(''); }, [parsedGpa, gradingSystem, ADMISSION_DATA]);
  const runDiagnosis = async (row: { univ: string; dept: string; type: string; name: string }, key: string) => {
    if (parsedGpa === null || !gradingSystem) return;
    const ticket = diagnosisGeneration.current; setPending(key);
    try { if (studentData?.id) await requireStudentAccess(studentData.id); const result = await requestAdmissionDiagnosis(parsedGpa, gradingSystem, row); if (ticket === diagnosisGeneration.current) setDiagnoses(previous => ({ ...previous, [key]: result })); }
    catch (error) { if (ticket === diagnosisGeneration.current) setDiagnoses(previous => ({ ...previous, [key]: { error: error instanceof Error ? error.message : '진단을 완료하지 못했습니다.' } })); }
    finally { if (ticket === diagnosisGeneration.current) setPending(''); }
  };

  const regions = useMemo(() => Array.from(new Set(ADMISSION_DATA.map((row) => row.region))).sort(), [ADMISSION_DATA]);
  const subRegions = useMemo(() => {
    if (!selectedRegion) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.region === selectedRegion).map((row) => row.subRegion))).sort();
  }, [ADMISSION_DATA, selectedRegion]);
  const univs = useMemo(() => {
    if (!selectedSubRegion) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.subRegion === selectedSubRegion).map((row) => row.univ))).sort();
  }, [ADMISSION_DATA, selectedSubRegion]);
  const tracks = useMemo(() => {
    if (!selectedUniv) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.univ === selectedUniv).map((row) => row.track))).sort();
  }, [ADMISSION_DATA, selectedUniv]);
  const depts = useMemo(() => {
    if (!selectedTrack) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.univ === selectedUniv && row.track === selectedTrack).map((row) => row.dept))).sort();
  }, [ADMISSION_DATA, selectedUniv, selectedTrack]);
  const types = useMemo(() => {
    if (!selectedDept) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.univ === selectedUniv && row.track === selectedTrack && row.dept === selectedDept).map((row) => row.type))).sort();
  }, [ADMISSION_DATA, selectedUniv, selectedTrack, selectedDept]);

  const filteredData = useMemo(
    () =>
      ADMISSION_DATA.filter((row) => {
        if (selectedRegion && row.region !== selectedRegion) return false;
        if (selectedSubRegion && row.subRegion !== selectedSubRegion) return false;
        if (selectedUniv && row.univ !== selectedUniv) return false;
        if (selectedTrack && row.track !== selectedTrack) return false;
        if (selectedDept && row.dept !== selectedDept) return false;
        if (selectedType && row.type !== selectedType) return false;
        return true;
      }),
    [ADMISSION_DATA, selectedRegion, selectedSubRegion, selectedUniv, selectedTrack, selectedDept, selectedType],
  );

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {dataLoading && <p role="status">수프리마 랩의 공통 입시 자료를 불러오고 있습니다.</p>}
      {dataError && <p role="alert">{dataError}</p>}
      {!dataLoading && !dataError && ADMISSION_DATA.length === 0 && <p role="status">반영된 공통 입시 자료가 없습니다. 수프리마 랩에서 자료를 반영해 주세요.</p>}
      <label style={{ display: 'block', marginBottom: '1rem' }}>진단 성적 체계 <select aria-label="진단 성적 체계" value={gradingSystem} onChange={event => setGradingSystem(event.target.value as '' | '9-level' | '5-level')}><option value="">선택해 주세요</option><option value="9-level">9등급제</option><option value="5-level">5등급제</option></select></label>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#fff', padding: '1.25rem 1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
              <ArrowLeft size={18} /> 뒤로가기
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={24} color="#3b82f6" /> 입시위치 진단 (입결 검색기)
            </h1>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
              {studentData ? `${studentData.name} 학생의 성적 체계를 선택한 뒤 전형별 진단을 실행해 주세요.` : '공통 입결을 조회하고, 학생을 선택하여 전형별 근거로 진단합니다.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>고교 유형</label>
            <select value={hsType} onChange={(e) => setHsType(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
              <option value="일반고">일반고</option>
              <option value="특목고">특목고</option>
            </select>
          </div>
          <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> 출력
          </button>
          <button disabled title="이 화면의 영구 저장은 아직 제공되지 않습니다." style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#64748b', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={18} /> 저장 기능 준비 중
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <AdmissionOfficerEvaluation
          averageGrade={parsedGpa}
          strongestSubject={selectedDept || '전공 탐색 중'}
          weakestGrade={parsedGpa ? Math.ceil(parsedGpa) : null}
          subjectCount={filteredData.length}
          compact
        />
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#64748b" /> 검색 조건
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '0.75rem' }}>
          {[
            { label: '권역', value: selectedRegion, options: regions, onChange: (value: string) => { setSelectedRegion(value); setSelectedSubRegion(''); setSelectedUniv(''); setSelectedTrack(''); setSelectedDept(''); setSelectedType(''); } },
            { label: '지역', value: selectedSubRegion, options: subRegions, onChange: (value: string) => { setSelectedSubRegion(value); setSelectedUniv(''); setSelectedTrack(''); setSelectedDept(''); setSelectedType(''); } },
            { label: '대학', value: selectedUniv, options: univs, onChange: (value: string) => { setSelectedUniv(value); setSelectedTrack(''); setSelectedDept(''); setSelectedType(''); } },
            { label: '계열', value: selectedTrack, options: tracks, onChange: (value: string) => { setSelectedTrack(value); setSelectedDept(''); setSelectedType(''); } },
            { label: '모집단위', value: selectedDept, options: depts, onChange: (value: string) => { setSelectedDept(value); setSelectedType(''); } },
            { label: '전형', value: selectedType, options: types, onChange: (value: string) => setSelectedType(value) },
          ].map((field) => (
            <label key={field.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
              {field.label}
              <select value={field.value} onChange={(e) => field.onChange(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                <option value="">전체</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} color="#64748b" /> 검색 결과 ({filteredData.length}건)
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
            <thead style={{ backgroundColor: '#f1f5f9' }}>
              <tr>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>대학</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>계열</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>모집단위</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>전형</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>전형명</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1', color: '#4f46e5' }}>26컷</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>25컷</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>24컷</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>비고</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>내 위치</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 120).map((row, index) => {
                const key = JSON.stringify([row.univ, row.dept, row.type, row.name]);
                const diagnosis = diagnoses[key];
                return (
                  <tr key={`${row.univ}-${row.dept}-${index}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{row.univ}</td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>{row.track}</td>
                    <td style={{ padding: '0.75rem', color: '#334155' }}>{row.dept}</td>
                    <td style={{ padding: '0.75rem' }}>{row.type}</td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>{row.name}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 800, color: '#4f46e5' }}>{row.cutoff26?.toFixed(2) ?? '-'}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{row.cutoff25?.toFixed(2) ?? '-'}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{row.cutoff24?.toFixed(2) ?? '-'}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.req}>{row.req || '-'}</td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}><button type="button" disabled={parsedGpa === null || !gradingSystem || Boolean(pending)} onClick={() => runDiagnosis(row, key)}>{pending === key ? '진단 중…' : '진단하기'}</button>{diagnosis?.error && <p role="alert">{diagnosis.error}</p>}{diagnosis?.level && <><strong>{diagnosis.level}</strong><p>{diagnosis.reason}</p></>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredData.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>조건에 맞는 입결 데이터가 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}
