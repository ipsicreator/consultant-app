import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, BrainCircuit, CheckCircle2, Search, Target } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { parseGpaTextToNumber } from '../../../utils/admission/admissionLines';
import { useAdmissionData } from '../data';
import { readStudentDraft } from '../../../lib/studentRecords';
import { DEFAULT_CATEGORY_MAP, SUBJECTS } from '../../../lib/explorationConfig';

interface EvaluationSimulationProps {
  onBack?: () => void;
  studentData?: { id: string; name: string } | null;
}

type StudentInfo = {
  hopeMajor?: string;
  gpa?: string;
  activities?: string;
};

type RubricState = {
  academic: number;
  inquiry: number;
  growth: number;
  fit: number;
};

const DEFAULT_RUBRIC: RubricState = { academic: 3, inquiry: 3, growth: 3, fit: 3 };

function scoreToLabel(score: number) {
  if (score >= 4) return '강함';
  if (score >= 3) return '보통';
  return '보완 필요';
}

export default function EvaluationSimulation({ onBack, studentData }: EvaluationSimulationProps) {
  const { rows: ADMISSION_DATA, loading: dataLoading, error: dataError } = useAdmissionData();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [keyword, setKeyword] = useState('');
  const [rubric, setRubric] = useState<RubricState>(DEFAULT_RUBRIC);
  const [rubricEdited, setRubricEdited] = useState(false);

  useEffect(() => { let active = true; setStudentInfo(null); setSelectedMajor(''); setKeyword(''); setRubricEdited(false);
    if (studentData?.id) readStudentDraft(studentData.id).then(saved => { if (active) { setStudentInfo(saved); setSelectedMajor(saved.hopeMajor || ''); setKeyword(saved.activities || ''); } }).catch(() => { if (active) setStudentInfo(null); });
    return () => { active = false; };
  }, [studentData?.id]);

  const parsedGpa = useMemo(() => (studentInfo?.gpa ? parseGpaTextToNumber(studentInfo.gpa) : null), [studentInfo]);
  const rubricAverage = Object.values(rubric).reduce((sum, value) => sum + value, 0) / Object.keys(rubric).length;
  const candidateKeywords = ['탐구', '독서', '협업', '문제해결', '자료분석'].filter((item) => `${studentInfo?.activities || ''} ${keyword}`.includes(item)).slice(0, 3);
  const interestIdeas = SUBJECTS.slice(0, 4).map((subject, index) => ({
    subject,
    description: DEFAULT_CATEGORY_MAP[subject]?.map((card) => card.title).join(' · ') || `교과 ${index + 1} 관련 탐구`,
  }));

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {dataLoading && <p role="status">수프리마 랩의 공통 입시 자료를 불러오고 있습니다.</p>}
      {dataError && <p role="alert">{dataError}</p>}
      {!dataLoading && !dataError && ADMISSION_DATA.length === 0 && <p role="status">반영된 공통 입시 자료가 없습니다. 수프리마 랩에서 자료를 반영해 주세요.</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#fff', padding: '1.25rem 1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer' }}><ArrowLeft size={18} /> 뒤로가기</button>}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit size={24} color="#7c3aed" /> 학생부/성적분석 · 탐구/독서 제안
            </h1>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
              {studentData ? `${studentData.name} 학생의 학생부와 성적을 기반으로 전공 적합 탐구와 독서 제안을 생성합니다.` : '학생을 선택하면 학생부 분석부터 탐구/독서 제안까지 연결됩니다.'}
            </p>
          </div>
        </div>
        <button disabled title="이 화면의 영구 저장은 아직 제공되지 않습니다." style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#64748b', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> 저장 기능 준비 중
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: '1.25rem' }}>
        <Stat title="평균 등급" value={parsedGpa?.toFixed(2) ?? '-'} />
        <Stat title="목표 전공" value={selectedMajor || '미설정'} />
        <Stat title="전형 비교" value="입시 진단에서 확인" />
        <Stat title="컨설턴트 참고 평가" value={rubricEdited ? scoreToLabel(rubricAverage) : '평가 전'} />
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1.3fr 0.7fr' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} color="#7c3aed" /> 입학사정관형 평가 기준
          </h2>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {(['academic', 'inquiry', 'growth', 'fit'] as const).map((key) => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                {key === 'academic' ? '학업 역량' : key === 'inquiry' ? '탐구 역량' : key === 'growth' ? '성장성' : '전공 적합성'}
                <input type="range" min={1} max={5} value={rubric[key]} onChange={(e) => { setRubricEdited(true); setRubric((prev) => ({ ...prev, [key]: Number(e.target.value) })); }} />
              </label>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <BarChart3 size={18} /> 간단 진단
            </div>
            <p style={{ margin: 0, lineHeight: 1.7, color: '#475569' }}>
              {rubricEdited ? '담당자가 입력한 참고 평가입니다. 입시 판정은 전형별 근거로 별도 확인해 주세요.' : '학생부 근거를 확인한 뒤 항목별 참고 평가를 입력해 주세요.'}
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="#7c3aed" /> 탐구/독서 제안
          </h2>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
            희망 전공
            <input value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} placeholder="예: 생명과학, 경영, 컴퓨터공학" style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginTop: '0.75rem' }}>
            핵심 키워드
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="탐구, 독서, 데이터, 실험..." style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
          </label>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {candidateKeywords.length > 0 ? candidateKeywords.map((item) => <span key={item} style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: '0.8rem', fontWeight: 700 }}>#{item}</span>) : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>학생부 키워드를 입력하면 추천어가 표시됩니다.</span>}
          </div>
          <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
            {interestIdeas.map((item) => (
              <div key={item.subject} style={{ padding: '0.9rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', backgroundColor: '#faf5ff' }}>
                <div style={{ fontWeight: 800, color: '#4c1d95' }}>{item.subject} 기반 탐구</div>
                <div style={{ marginTop: '0.35rem', color: '#475569', lineHeight: 1.6, fontSize: '0.9rem' }}>{item.description}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>독서 제안 흐름</div>
            <p style={{ margin: 0, lineHeight: 1.7, color: '#475569' }}>학생부 분석 → 탐구주제 제안 → 관련 도서 연결 → 보고서 작성 순서로 운영합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
      <div style={{ color: '#7c3aed', fontWeight: 800, fontSize: '0.8rem' }}>{title}</div>
      <div style={{ marginTop: '0.4rem', fontSize: '1.1rem', fontWeight: 900 }}>{value}</div>
    </div>
  );
}
