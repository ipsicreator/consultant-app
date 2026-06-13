import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Compass, Filter, Printer, Save, Search } from 'lucide-react';
import { parseGpaTextToNumber } from '../../../utils/admission/admissionLines';
import AdmissionOfficerEvaluation from '../AdmissionOfficerEvaluation';
import { ADMISSION_DATA } from '../data';

interface PositionDiagnosisProps {
  onBack?: () => void;
  studentData?: { id: string; name: string } | null;
}

function getGapLabel(gpa: number, cutoff: number, hsType: string) {
  const gap = gpa - cutoff;
  const maxGap = hsType === '특목고' ? 1.0 : 0.5;

  if (gap <= 0) return { text: `+${Math.abs(gap).toFixed(2)} (안정/상향)`, color: '#16a34a' };
  if (gap <= maxGap) return { text: `+${gap.toFixed(2)} (도전 가능)`, color: '#d97706' };
  return { text: `+${gap.toFixed(2)} (위험/상향권장)`, color: '#dc2626' };
}

export default function PositionDiagnosis({ onBack, studentData }: PositionDiagnosisProps) {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSubRegion, setSelectedSubRegion] = useState('');
  const [selectedUniv, setSelectedUniv] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [hsType, setHsType] = useState('일반고');
  const [isSaved, setIsSaved] = useState(false);

  const parsedGpa = useMemo(() => {
    if (!studentData?.id) return null;
    try {
      const savedInfo = JSON.parse(localStorage.getItem(`student_info_${studentData.id}`) || '{}');
      return savedInfo.gpa ? parseGpaTextToNumber(savedInfo.gpa) : null;
    } catch {
      return null;
    }
  }, [studentData?.id]);

  const regions = useMemo(() => Array.from(new Set(ADMISSION_DATA.map((row) => row.region))).sort(), []);
  const subRegions = useMemo(() => {
    if (!selectedRegion) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.region === selectedRegion).map((row) => row.subRegion))).sort();
  }, [selectedRegion]);
  const univs = useMemo(() => {
    if (!selectedSubRegion) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.subRegion === selectedSubRegion).map((row) => row.univ))).sort();
  }, [selectedSubRegion]);
  const tracks = useMemo(() => {
    if (!selectedUniv) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.univ === selectedUniv).map((row) => row.track))).sort();
  }, [selectedUniv]);
  const depts = useMemo(() => {
    if (!selectedTrack) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.univ === selectedUniv && row.track === selectedTrack).map((row) => row.dept))).sort();
  }, [selectedUniv, selectedTrack]);
  const types = useMemo(() => {
    if (!selectedDept) return [];
    return Array.from(new Set(ADMISSION_DATA.filter((row) => row.univ === selectedUniv && row.track === selectedTrack && row.dept === selectedDept).map((row) => row.type))).sort();
  }, [selectedUniv, selectedTrack, selectedDept]);

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
    [selectedRegion, selectedSubRegion, selectedUniv, selectedTrack, selectedDept, selectedType],
  );

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
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
              {studentData ? `${studentData.name} 학생의 입력값(${parsedGpa ?? '미입력'})을 기준으로 지원 가능성을 진단합니다.` : '학생을 선택하면 2024~2026 입결 자료를 기준으로 지원 가능성을 진단합니다.'}
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
          <button onClick={() => { setIsSaved(true); window.setTimeout(() => setIsSaved(false), 2000); }} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: isSaved ? '#10b981' : '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isSaved ? <><CheckCircle2 size={18} /> 저장됨</> : <><Save size={18} /> 저장</>}
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
                const cutoff = row.cutoff26 ?? row.cutoff25 ?? row.cutoff24;
                const gap = parsedGpa !== null && cutoff !== null ? getGapLabel(parsedGpa, cutoff, hsType) : null;
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
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: gap?.color ?? '#64748b' }}>{gap?.text ?? '-'}</td>
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
