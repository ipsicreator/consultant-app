import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, BrainCircuit, CheckCircle2, Search, Target } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { parseGpaTextToNumber } from '../../../utils/admission/admissionLines';
import { ADMISSION_DATA } from '../data';
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
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [keyword, setKeyword] = useState('');
  const [rubric, setRubric] = useState<RubricState>(DEFAULT_RUBRIC);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (!studentData?.id) {
          setStudentInfo(null);
          return;
        }
        const saved = JSON.parse(localStorage.getItem(`student_info_${studentData.id}`) || '{}') as StudentInfo;
        setStudentInfo(saved);
        setSelectedMajor(saved.hopeMajor || '');
        setKeyword(saved.activities || '');
      } catch {
        setStudentInfo(null);
      }
    };
    load();
  }, [studentData?.id]);

  const parsedGpa = useMemo(() => (studentInfo?.gpa ? parseGpaTextToNumber(studentInfo.gpa) : null), [studentInfo?.gpa]);
  const recommendedCutoff = useMemo(() => {
    const row = ADMISSION_DATA.find((item) => selectedMajor && item.dept.includes(selectedMajor)) || ADMISSION_DATA[0];
    return row?.cutoff26 ?? row?.cutoff25 ?? row?.cutoff24 ?? null;
  }, [selectedMajor]);

  const targetGap = parsedGpa !== null && recommendedCutoff !== null ? (recommendedCutoff - parsedGpa).toFixed(2) : '-';
  const rubricAverage = Object.values(rubric).reduce((sum, value) => sum + value, 0) / Object.keys(rubric).length;
  const candidateKeywords = ['탐구', '독서', '협업', '문제해결', '자료분석'].filter((item) => `${studentInfo?.activities || ''} ${keyword}`.includes(item)).slice(0, 3);
  const interestIdeas = SUBJECTS.slice(0, 4).map((subject, index) => ({
    subject,
    description: DEFAULT_CATEGORY_MAP[subject]?.map((card) => card.title).join(' · ') || `교과 ${index + 1} 관련 탐구`,
  }));

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
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
        <button onClick={() => { setIsSaved(true); window.setTimeout(() => setIsSaved(false), 2000); }} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: isSaved ? '#10b981' : '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {isSaved ? '저장됨' : '저장'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: '1.25rem' }}>
        <Stat title="평균 등급" value={parsedGpa?.toFixed(2) ?? '-'} />
        <Stat title="목표 전공" value={selectedMajor || '미설정'} />
        <Stat title="컷 차이" value={targetGap} />
        <Stat title="사정관 총평" value={scoreToLabel(rubricAverage)} />
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
                <input type="range" min={1} max={5} value={rubric[key]} onChange={(e) => setRubric((prev) => ({ ...prev, [key]: Number(e.target.value) }))} />
              </label>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <BarChart3 size={18} /> 간단 진단
            </div>
            <p style={{ margin: 0, lineHeight: 1.7, color: '#475569' }}>
              학생부 요약과 성적을 함께 보면 {scoreToLabel(rubricAverage)} 수준입니다. 탐구와 독서 제안은 전공 적합성 보완에 초점을 두고 연결합니다.
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
