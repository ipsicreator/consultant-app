import { useState, useEffect, useMemo } from 'react';
import { pb } from '../lib/pocketbase';
import { MOCK_CANDIDATE, MAJORS, UNIVERSITIES, SUCCESSFUL_CANDIDATES, computeTermAvgFromRecords } from '../utils/evaluationLogic';
import { parseGpaTextToNumber } from '../utils/admissionLines';
// @ts-ignore
import rawData from '../data/admissionData.json';
import RadarEvaluationChart from './charts/RadarEvaluationChart';
import RubricPanel from './evaluation/RubricPanel';
import SepecViewer from './evaluation/SepecViewer';
import { ArrowLeft, Save, CheckCircle2, Target, Printer, Trophy, Activity } from 'lucide-react';

interface EvaluationSimulationProps {
  onBack?: () => void;
  studentData?: { id: string; name: string } | null;
}

interface AdmissionRow {
  region: string;
  subRegion: string;
  univ: string;
  track: string;
  dept: string;
  type: string;
  name: string;
  cutoff26: number | null;
  cutoff25: number | null;
  req: string;
}
const ADMISSION_DATA: AdmissionRow[] = rawData as AdmissionRow[];

export default function EvaluationSimulation({ onBack, studentData }: EvaluationSimulationProps) {
  const [candidate, setCandidate] = useState<any>(MOCK_CANDIDATE);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedUnivId, setSelectedUnivId] = useState<string>('snu');
  const [selectedMajorKey, setSelectedMajorKey] = useState(MAJORS[0].key);
  const [keyword, setKeyword] = useState('');
  
  const [rubricState, setRubricState] = useState<Record<string, string>>({});
  
  const [parsedGpa, setParsedGpa] = useState<number | null>(null);
  const [targetDeptIdx, setTargetDeptIdx] = useState<number>(-1);
  const [hsType, setHsType] = useState<string>('일반고');

  useEffect(() => {
    const loadRealData = async () => {
      setIsLoading(true);
      try {
        if (studentData?.id) {
          const savedInfo = JSON.parse(localStorage.getItem(`student_info_${studentData.id}`) || '{}');
          if (savedInfo.gpa) {
            setParsedGpa(parseGpaTextToNumber(savedInfo.gpa));
          }

          const records = await pb.collection('suprima_pdf_analyses').getFullList({
            filter: `student_id = "${studentData.id}"`,
            sort: '-created',
          });
          const analysis = records.find(r => !r.content.dataType || r.content.dataType === 'analysis');
          
          if (analysis && analysis.content) {
            const content = analysis.content;
            setCandidate({
              id: studentData.id,
              schoolLine: `실제 데이터 · ${studentData.name} 학생`,
              track: "일반고 · 실제 분석 기반",
              takenCourses: content.gradeAnalysis?.map((g: any) => g.subject) || ["국어", "영어", "수학Ⅰ", "물리학Ⅰ"],
              gradesBySubject: {},
              realGpa: content.detectedGpa || "데이터 없음",
              sepec: [
                { term: "종합", subject: "분석 요약", text: content.summary || "" },
                { term: "종합", subject: "세특 초안", text: content.finalRecordDraft || "" }
              ],
              ca: {
                autonomous: [{ tag: "강점", text: content.strengths?.join('\n') || "" }],
                club: [{ tag: "비교과 활동", text: content.detectedActivities || "" }],
                career: [{ tag: "보완점", text: content.improvements?.join('\n') || "" }]
              }
            });
          } else {
            setCandidate({ ...MOCK_CANDIDATE, schoolLine: `분석 데이터 부족 · ${studentData.name} 학생 (가상 혼합)` });
          }
        } else {
          setCandidate(MOCK_CANDIDATE);
        }
      } catch (error) {
        console.error("DB 로드 실패, 데모 데이터 사용", error);
        setCandidate(MOCK_CANDIDATE);
      } finally {
        setIsLoading(false);
      }
    };

    loadRealData();
  }, [studentData]);

  const selectedUniv = UNIVERSITIES.find(u => u.id === selectedUnivId) || UNIVERSITIES[0];
  const selectedMajor = MAJORS.find(m => m.key === selectedMajorKey) || MAJORS[0];
  
  useEffect(() => {
    const newState: Record<string, string> = {};
    const defaultLabels = ['academic', 'career', 'community', 'inquiry', 'attitude', 'growth'];
    selectedUniv.labels.forEach((_, i) => {
      newState[defaultLabels[i]] = 'B';
    });
    setRubricState(newState);
  }, [selectedUnivId]);

  const matchingTargets = useMemo(() => {
    if (!selectedUniv) return [];
    return ADMISSION_DATA.filter(d => d.univ.includes(selectedUniv.name) && (d.cutoff26 || d.cutoff25));
  }, [selectedUniv]);

  useEffect(() => {
    setTargetDeptIdx(matchingTargets.length > 0 ? 0 : -1);
  }, [matchingTargets]);

  const activeTarget = targetDeptIdx >= 0 ? matchingTargets[targetDeptIdx] : null;
  const cutoff = activeTarget ? (activeTarget.cutoff26 || activeTarget.cutoff25 || 0) : 0;

  const computeRubricScore = () => {
    const keys = Object.keys(rubricState);
    if (keys.length === 0) return 0;
    let total = 0;
    keys.forEach(k => {
      const val = rubricState[k];
      if (val === 'A') total += 100;
      else if (val === 'B') total += 80;
      else total += 60;
    });
    return Math.round(total / keys.length);
  };
  const rubricScore = computeRubricScore();

  const getSynthesisResult = () => {
    if (!parsedGpa || !cutoff || !activeTarget) return null;
    const gpaGap = parsedGpa - cutoff;
    const maxReversalGap = hsType === '특목고' ? 1.0 : 0.5;
    
    if (gpaGap <= -0.1 && rubricScore >= 80) return { title: '✅ 최초합 안정권', desc: '내신과 비교과 모두 해당 대학/학과 기준을 여유있게 충족합니다.', color: '#16a34a', bg: '#dcfce7' };
    if (gpaGap <= 0.1 && rubricScore >= 85) return { title: '✅ 적정 합격권', desc: '해당 학과의 합격선에 부합하며, 세특 경쟁력도 뛰어납니다.', color: '#2563eb', bg: '#dbeafe' };
    if (gpaGap > 0.1 && gpaGap <= maxReversalGap && rubricScore >= 95) return { title: '🔥 세특 역전 가능권 (상향/소신)', desc: `해당 고교 유형(${hsType})의 보정 범위(최대 +${maxReversalGap}등급) 내에 있습니다. 내신은 다소 부족하나 압도적인 정성평가(세특) 점수로 1단계 통과 및 역전을 노려볼 만합니다.`, color: '#d97706', bg: '#fef3c7' };
    if (gpaGap > maxReversalGap) return { title: '❌ 1단계 통과 위험 (정량 부족)', desc: `고교 유형(${hsType}) 보정치를 감안하더라도 내신 격차가 너무 커서 서류 탈락 위험이 매우 높습니다. 하향 지원을 권장합니다.`, color: '#dc2626', bg: '#fee2e2' };
    if (gpaGap > 0.1 && rubricScore < 85) return { title: '⚠ 불합격 위험 (정성 부족)', desc: '내신이 부족한 상태에서 이를 뒤집을 만한 세특 경쟁력도 보이지 않습니다. 세특을 강력하게 보완해야 합니다.', color: '#dc2626', bg: '#fee2e2' };
    if (gpaGap <= 0 && rubricScore < 80) return { title: '⚠ 1단계 서류 통과 주의', desc: '내신은 충분하나 세특(정성평가)이 다소 아쉽습니다. 학종보다는 교과 전형을 고려해볼 수 있습니다.', color: '#ca8a04', bg: '#fef9c3' };
    
    return { title: '🔄 추가 보완 필요 (소신)', desc: '현재 내신과 세특 수준으로는 지원 가능 범위에 걸쳐 있습니다. 면접이나 수능 최저를 대비해야 합니다.', color: '#0f766e', bg: '#ccfbf1' };
  };
  const synthesis = getSynthesisResult();

  const successfulCase = SUCCESSFUL_CANDIDATES[`${selectedUnivId}_${selectedMajorKey}`] || SUCCESSFUL_CANDIDATES["default"];

  const checkCoreSubjects = () => {
    const taken = new Set(candidate.takenCourses || []);
    return selectedMajor.coreGroups.map(g => {
      const count = g.required.filter(s => taken.has(s)).length;
      const status = count === g.required.length ? "충족" : (count > 0 ? "부분충족" : "미충족");
      return { group: g.group, required: g.required, taken: g.required.filter(s => taken.has(s)), status };
    });
  };

  const coreCheckResults = checkCoreSubjects();
  const missCount = coreCheckResults.filter(r => r.status === '미충족').length;
  const partialCount = coreCheckResults.filter(r => r.status === '부분충족').length;

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;

  return (
    <div className="p-6 min-h-screen" style={{ padding: '1.5rem', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '1.25rem 1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {onBack && (
            <button onClick={onBack} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={18} /> <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>뒤로가기</span>
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={24} color="#4f46e5" /> 목표 대학별 평가 시뮬레이션
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
              {studentData ? `${studentData.name} 학생의 세특 내용을 바탕으로 ${selectedUniv?.name}의 실제 평가 기준에 맞춰 시뮬레이션 합니다.` : '실제 대학의 학생부종합전형 평가 기준을 적용하여 시뮬레이션 합니다.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>고교 유형 (평가 보정용)</label>
            <select 
              value={hsType} 
              onChange={(e) => setHsType(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 600, color: '#1e293b' }}
            >
              <option value="일반고">일반고 (전국/광역자사 포함)</option>
              <option value="특목고">특목고</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>목표 대학</label>
            <select 
              value={selectedUnivId} 
              onChange={(e) => setSelectedUnivId(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 600, color: '#1e293b' }}
            >
              {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>세부 타겟 (학과 및 전형)</label>
            <select 
              value={targetDeptIdx} 
              onChange={(e) => setTargetDeptIdx(parseInt(e.target.value))}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 600, color: '#1e293b', width: '350px' }}
            >
              {matchingTargets.length === 0 ? <option value="-1">데이터 없음</option> : null}
              {matchingTargets.map((m, idx) => (
                <option key={idx} value={idx}>{m.dept} ({m.type} - {m.name})</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handlePrint}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}
          >
            <Printer size={18} /> 출력
          </button>
          <button 
            onClick={handleSave}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', backgroundColor: isSaved ? '#10b981' : '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
          >
            {isSaved ? <><CheckCircle2 size={18} /> 저장됨</> : <><Save size={18} /> 저장</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e0e7ff', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Trophy size={20} color="#f59e0b" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>합격자 사례 비교 ({selectedUniv.name})</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>현재 학생 강점/키워드</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(candidate.ca?.autonomous?.[0]?.text?.split('\n').filter(Boolean).slice(0, 3) || ["정보 부족"]).map((kw: string, i: number) => (
                    <span key={i} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', color: '#334155', borderRadius: '0.25rem', fontSize: '0.8rem' }}>{kw}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#b45309' }}>합격자 평균 키워드</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {successfulCase.keywords.map((kw: string, i: number) => (
                    <span key={i} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f59e0b', color: '#fff', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>{kw}</span>
                  ))}
                </div>
                <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#92400e', lineHeight: '1.5' }}>"{successfulCase.sepecSnippet}"</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>학생부 원문 분석 (세특/창체)</h2>
              <input 
                type="text" 
                placeholder="키워드 검색 (예: 협업, 미분)" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: '250px', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
              />
            </div>
            
            <SepecViewer sepecData={candidate.sepec || []} keyword={keyword} />
            
            {candidate.ca && (
              <>
                <h3 style={{ margin: '1.5rem 0 1rem 0', fontSize: '1.1rem', color: '#334155' }}>창의적 체험활동 요약</h3>
                <SepecViewer sepecData={[
                  ...(candidate.ca.autonomous || []), 
                  ...(candidate.ca.club || []), 
                  ...(candidate.ca.career || [])
                ].map((c: any) => ({ term: '활동', subject: c.tag, text: c.text }))} keyword={keyword} />
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1e293b' }}>전공 핵심과목 이수 점검</h2>
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: (missCount === 0 && partialCount === 0) ? '#dcfce7' : '#fef2f2', borderRadius: '0.5rem', color: (missCount === 0 && partialCount === 0) ? '#166534' : '#991b1b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {(missCount === 0 && partialCount === 0) ? <><CheckCircle2 size={20} /> 핵심과목 충족 (지원 가능)</> : `⚠ 미충족 ${missCount}개 · 부분충족 ${partialCount}개 (보완 필요)`}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>요구 영역</th>
                  <th style={{ padding: '0.5rem' }}>충족 판정</th>
                  <th style={{ padding: '0.5rem' }}>학생 이수 과목</th>
                </tr>
              </thead>
              <tbody>
                {coreCheckResults.map(r => (
                  <tr key={r.group} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#475569' }}>{r.group}</td>
                    <td style={{ padding: '0.5rem', color: r.status === '충족' ? '#16a34a' : (r.status === '부분충족' ? '#ca8a04' : '#dc2626'), fontWeight: 600 }}>{r.status}</td>
                    <td style={{ padding: '0.5rem', color: '#64748b' }}>{r.taken.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>{selectedUniv.name} 평가 루브릭</h2>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>각 대학 모집요강 기준</span>
              </div>
              <RubricPanel rubricState={rubricState} setRubricState={setRubricState} labels={selectedUniv.labels} />
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1e293b', textAlign: 'center' }}>역량 밸런스 분석</h2>
              <RadarEvaluationChart rubricState={rubricState} labels={selectedUniv.labels} />
            </div>
          </div>
        </div>
      </div>

      {synthesis && (
        <div style={{ backgroundColor: synthesis.bg, border: `2px solid ${synthesis.color}`, borderRadius: '1rem', padding: '2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={32} color={synthesis.color} />
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: synthesis.color }}>최종 합불 예측: {synthesis.title}</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#475569', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>1. 정량적 내신 격차 (GPA Gap)</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>내 내신등급: <strong>{parsedGpa?.toFixed(2)}</strong></span>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>타겟({activeTarget?.dept}) 컷오프: <strong>{cutoff?.toFixed(2)}</strong></span>
              </div>
              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, color: (parsedGpa! - cutoff) <= 0 ? '#16a34a' : '#dc2626' }}>
                {(parsedGpa! - cutoff) <= 0 ? '▼ ' : '▲ '} {Math.abs(parsedGpa! - cutoff).toFixed(2)} 등급 {(parsedGpa! - cutoff) <= 0 ? '여유' : '부족'}
              </div>
            </div>
            
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#475569', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>2. 정성적 세특 역량 (Rubric Score)</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>컨설턴트 부여 등급 평균</span>
              </div>
              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, color: rubricScore >= 85 ? '#2563eb' : '#d97706' }}>
                {rubricScore} / 100 점
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '0.75rem', borderLeft: `6px solid ${synthesis.color}` }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1e293b' }}>AI 컨설팅 리포트</h3>
            <p style={{ margin: 0, fontSize: '1.05rem', color: '#334155', lineHeight: '1.6' }}>{synthesis.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
