import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Download, Loader2 } from 'lucide-react';
import './LearningWorkflow.css';

type Stage = 'ready' | 'input' | 'processing' | 'result' | 'history' | 'export';

interface Props {
  studentData: { id: string; name: string } | null;
}

interface RunResult {
  createdAt: string;
  studentName: string;
  targetMajor: string;
  summary: string;
  strengths: string[];
  nextActions: string[];
}

const stages: { key: Stage; label: string; meaning: string }[] = [
  { key: 'ready', label: '입력전', meaning: '진단 목표와 준비 데이터를 확인합니다.' },
  { key: 'input', label: '입력', meaning: '학생 정보를 구조화해 분석 기반을 만듭니다.' },
  { key: 'processing', label: '진행', meaning: '분석 단계를 투명하게 보여 신뢰를 확보합니다.' },
  { key: 'result', label: '결과', meaning: '학생 맞춤형 요약과 실행안을 제공합니다.' },
  { key: 'history', label: '경과', meaning: '시점별 변화를 추적해 성장 피드백을 강화합니다.' },
  { key: 'export', label: '산출', meaning: '상담 결과를 문서로 남겨 실행력을 높입니다.' },
];

const LearningWorkflow: React.FC<Props> = ({ studentData }) => {
  const [stage, setStage] = useState<Stage>('ready');
  const [name, setName] = useState(studentData?.name ?? '');
  const [grade, setGrade] = useState('2');
  const [targetMajor, setTargetMajor] = useState('컴퓨터공학');
  const [interest, setInterest] = useState('AI 기반 교육 서비스 설계');
  const [notes, setNotes] = useState('수행평가 발표 경험이 있고, 데이터 분석에 관심이 높음');
  const [result, setResult] = useState<RunResult | null>(null);
  const [history, setHistory] = useState<RunResult[]>([]);

  const currentIndex = useMemo(() => stages.findIndex((s) => s.key === stage), [stage]);

  const runAnalysis = async () => {
    setStage('processing');
    await new Promise((r) => setTimeout(r, 1400));
    const built: RunResult = {
      createdAt: new Date().toLocaleString('ko-KR'),
      studentName: name || '미입력 학생',
      targetMajor,
      summary: `${name || '학생'}은(는) ${interest} 주제에서 질문-근거-결론 구조가 안정적이며, ${targetMajor} 연계 탐구 확장 가능성이 높습니다.`,
      strengths: [
        '핵심 질문을 구체화하는 능력',
        '자료 정리 및 근거 제시의 일관성',
        '발표/서술에서 논리 흐름 유지',
      ],
      nextActions: [
        '주 1회 탐구 로그 점검',
        '세특 문장 근거자료 월 2건 축적',
        '목표 전공 연계 미니 프로젝트 1건 수행',
      ],
    };
    setResult(built);
    setHistory((prev) => [built, ...prev].slice(0, 20));
    setStage('result');
  };

  const exportDoc = () => {
    if (!result) return;
    const body = `최종 결과 보고서\n\n학생명: ${result.studentName}\n목표 전공: ${result.targetMajor}\n생성 시각: ${result.createdAt}\n\n요약\n${result.summary}\n\n강점\n- ${result.strengths.join('\n- ')}\n\n다음 실행안\n- ${result.nextActions.join('\n- ')}\n`;
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${result.studentName}_최종결과.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="wf-wrap">
      <div className="wf-steps">
        {stages.map((s, i) => (
          <button key={s.key} className={`wf-step ${i <= currentIndex ? 'done' : ''} ${stage === s.key ? 'active' : ''}`} onClick={() => setStage(s.key)}>
            {i < currentIndex ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <section className="wf-panel">
        <h2>{stages[currentIndex].label} 화면</h2>
        <p className="wf-meaning">교육적 의미: {stages[currentIndex].meaning}</p>

        {stage === 'ready' && (
          <div className="wf-card">
            <h3>분석 준비 체크리스트</h3>
            <ul>
              <li>학생 기본정보 확인</li>
              <li>목표 전공/진로 확인</li>
              <li>최근 학생부/수행평가 기록 점검</li>
            </ul>
            <button onClick={() => setStage('input')}>다음: 입력</button>
          </div>
        )}

        {stage === 'input' && (
          <div className="wf-form">
            <label>학생명<input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>학년
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option>
              </select>
            </label>
            <label>목표 전공<input value={targetMajor} onChange={(e) => setTargetMajor(e.target.value)} /></label>
            <label>핵심 관심사<input value={interest} onChange={(e) => setInterest(e.target.value)} /></label>
            <label>추가 관찰노트<textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            <button onClick={runAnalysis}>분석 실행</button>
          </div>
        )}

        {stage === 'processing' && (
          <div className="wf-card center">
            <Loader2 className="spin" size={24} />
            <h3>분석 진행 중</h3>
            <p>입력 데이터 구조화 → 진단 생성 → 실행안 추천을 수행합니다.</p>
          </div>
        )}

        {stage === 'result' && result && (
          <div className="wf-card">
            <h3>{result.studentName} 결과 요약</h3>
            <p>{result.summary}</p>
            <h4>강점</h4>
            <ul>{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <h4>다음 실행안</h4>
            <ol>{result.nextActions.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <div className="wf-actions">
              <button onClick={() => setStage('history')}>경과 보기</button>
              <button onClick={() => setStage('export')}>산출물 만들기</button>
            </div>
          </div>
        )}

        {stage === 'history' && (
          <div className="wf-card">
            <h3>경과 이력</h3>
            {history.length === 0 ? <p>이력이 없습니다.</p> : (
              <ul className="history-list">
                {history.map((h, i) => <li key={i}><strong>{h.studentName}</strong> · {h.createdAt}<br />{h.summary}</li>)}
              </ul>
            )}
            <button onClick={() => setStage('export')}>산출로 이동</button>
          </div>
        )}

        {stage === 'export' && (
          <div className="wf-card">
            <h3>최종 산출</h3>
            <p>결과를 문서로 다운로드해 상담 기록으로 남깁니다.</p>
            <button onClick={exportDoc}><Download size={16} /> 최종 결과 다운로드</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default LearningWorkflow;
