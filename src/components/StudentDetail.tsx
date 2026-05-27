import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ArrowLeft, FileSearch, Save, FileText, RefreshCw, Sparkles, History, ClipboardList, ChevronRight, BarChart3, Target, Printer, Upload, Send,
  Square, Plus, Trash2, Calendar, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pb } from '../lib/pocketbase';
import { fileToGenerativePart } from '../lib/gemini';
import './StudentDetail.css';

interface StudentDetailProps {
  studentData: { id: string; name: string } | null;
  onBack: () => void;
}

type Analysis = {
  summary: string;
  gradeAnalysis: { subject: string; score: number; comment: string }[];
  strengths: string[];
  improvements: string[];
  finalRecordDraft: string;
  studentKeywords: string[];
};

const fallbackAnalysis = (input: string): Analysis => ({
  summary: `입력 내용 기반 분석 결과: ${input.slice(0, 80)}...`,
  gradeAnalysis: [
    { subject: '국어', score: 87, comment: '핵심 문장 구성 안정적' },
    { subject: '수학', score: 91, comment: '문제해결 논리 우수' },
    { subject: '과학', score: 90, comment: '탐구 설계/검증 태도 우수' },
  ],
  strengths: ['자기주도 학습태도', '탐구 지속성', '협업 커뮤니케이션'],
  improvements: ['활동별 정량 근거 추가', '과목 간 연결 문장 강화'],
  finalRecordDraft: '학생은 교과 기반 탐구활동에서 주도적으로 문제를 정의하고 자료를 구조화하여, 전공 적합성을 보여주는 성과를 도출함.',
  studentKeywords: ['문제해결', '탐구심', '협업'],
});

const StudentDetail: React.FC<StudentDetailProps> = ({ studentData, onBack }) => {
  const [activeView, setActiveView] = useState<'analysis' | 'planner' | 'evaluation'>('analysis');
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  // Input fields (initialized from localStorage if available)
  const [inputText, setInputText] = useState('');
  const [hopeMajor, setHopeMajor] = useState('');
  const [gpa, setGpa] = useState('');
  const [activities, setActivities] = useState('');

  // Results & History list (contains raw pb records)
  const [result, setResult] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  // User Keywords
  const [userKeywords, setUserKeywords] = useState(['', '', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Planner States
  const [plannerRecord, setPlannerRecord] = useState<any>(null);
  const [plannerTasks, setPlannerTasks] = useState<any[]>([]);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskWeek, setNewTaskWeek] = useState<number>(1);

  // Evaluation States
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [isEditingEval, setIsEditingEval] = useState(false);
  const [evalType, setEvalType] = useState<'monthly' | 'quarterly' | 'semester'>('monthly');
  const [evalTitle, setEvalTitle] = useState('');
  const [evalSemester, setEvalSemester] = useState('');
  const [evalAttitude, setEvalAttitude] = useState('');
  const [evalInquiry, setEvalInquiry] = useState('');
  const [evalPlan, setEvalPlan] = useState('');
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [printEval, setPrintEval] = useState<any>(null);

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const genAI = useMemo(() => new GoogleGenerativeAI(geminiKey), [geminiKey]);

  const loadHistory = async () => {
    if (!studentData?.id) return;
    try {
      const records = await pb.collection('suprima_pdf_analyses').getFullList({
        filter: `student_id = "${studentData.id}"`,
        sort: '-created',
      });
      setHistory(records);
      
      // Filter evaluation history
      const evals = records.filter(r => r.content?.dataType === 'evaluation');
      setEvaluationHistory(evals);
      
      // Load planner data
      const planner = records.find(r => r.content?.dataType === 'planner');
      setPlannerRecord(planner);
      if (planner) {
        setPlannerTasks(planner.content?.tasks || []);
        setFeedbackNote(planner.content?.consultantNote || '');
      } else {
        setPlannerTasks([]);
        setFeedbackNote('');
      }
    } catch (e) {
      console.error('loadHistory error:', e);
    }
  };

  useEffect(() => {
    if (studentData?.id) {
      const savedInfo = JSON.parse(localStorage.getItem(`student_info_${studentData.id}`) || '{}');
      if (savedInfo.hopeMajor) setHopeMajor(savedInfo.hopeMajor);
      if (savedInfo.gpa) setGpa(savedInfo.gpa);
      if (savedInfo.activities) setActivities(savedInfo.activities);
      
      loadHistory();
      setActiveView('analysis');
      setSelectedEval(null);
      setIsEditingEval(false);
    }
  }, [studentData?.id]);

  useEffect(() => {
    if (studentData?.id) {
      const info = { hopeMajor, gpa, activities };
      localStorage.setItem(`student_info_${studentData.id}`, JSON.stringify(info));
    }
  }, [hopeMajor, gpa, activities, studentData?.id]);

  useEffect(() => {
    const handleTransfer = async (e: any) => {
      if (e.detail && e.detail.title && studentData?.id) {
        try {
          const records = await pb.collection('suprima_pdf_analyses').getFullList({
            filter: `student_id = "${studentData.id}"`,
            sort: '-created',
          });
          const planner = records.find(r => r.content?.dataType === 'planner');
          const currentTasks = planner?.content?.tasks || [];
          const currentNote = planner?.content?.consultantNote || '';
          
          const newTask = {
            id: Date.now().toString() + Math.random().toString(),
            text: `[탐구활동] ${e.detail.title}`,
            week: 1,
            done: false,
          };
          const updatedTasks = [...currentTasks, newTask];
          const content = {
            dataType: 'planner',
            tasks: updatedTasks,
            consultantNote: currentNote
          };
          
          if (planner) {
            await pb.collection('suprima_pdf_analyses').update(planner.id, { content });
          } else {
            await pb.collection('suprima_pdf_analyses').create({
              student_id: studentData.id,
              content
            });
          }
          await loadHistory();
          alert(`[탐구활동 제안]에서 '${e.detail.title}' 과제가 플래너에 추가되었습니다!`);
        } catch (err) {
          console.error('Planner transfer error:', err);
        }
      }
    };
    window.addEventListener('TRANSFER_TO_PLANNER', handleTransfer);
    return () => window.removeEventListener('TRANSFER_TO_PLANNER', handleTransfer);
  }, [studentData?.id, plannerRecord]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsPdfLoading(true);
    try {
      if (!geminiKey) {
        throw new Error("API 키가 없습니다.");
      }
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const filePart = await fileToGenerativePart(file);
      
      const prompt = `이 PDF 문서는 학생의 학교생활기록부(또는 성적, 활동 기록) 문서 파일입니다.
이 문서 안에 적혀 있는 '교과학습발달상황(세부능력 및 특기사항 포함)', '창의적 체험활동상황(자율/동아리/진로)', '행동특성 및 종합의견' 등의 모든 텍스트를 빠짐없이 추출하여 반환해 주세요.
PDF의 양식이나 표는 무시하고, 내용(글) 자체만 모두 이어서 출력하면 됩니다.`;

      const result = await model.generateContent([prompt, filePart]);
      const extractedText = result.response.text();
      
      setInputText(prev => prev + (prev ? '\n\n' : '') + extractedText.trim());
    } catch (error) {
      console.error('PDF extraction error:', error);
      alert('AI PDF 텍스트 추출에 실패했습니다. 암호가 걸려있지 않은지 확인해 주세요.');
    } finally {
      setIsPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const runAnalysis = async () => {
    if (!inputText.trim()) {
      alert('학생부 내용이나 근거를 입력해 주세요.');
      return;
    }

    setIsScanning(true);
    try {
      if (!geminiKey) {
        setResult(fallbackAnalysis(inputText));
        return;
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `다음 학생의 학업 정보와 학생부 텍스트를 분석해 JSON으로 반환하세요.
희망 전공: ${hopeMajor}
내신 등급: ${gpa} (비어있거나 부족한 경우 학생부 내용에서 추출해 채우세요)
비교과 활동: ${activities} (비어있거나 부족한 경우 학생부 내용에서 추출해 채우세요)
학생부 내용: ${inputText}

요청:
1. summary: 종합 요약
2. gradeAnalysis: 교과 분석 [{subject,score,comment}]
3. strengths: 강점 리스트 []
4. improvements: 보완점 리스트 []
5. finalRecordDraft: 세특 문장 초안
6. studentKeywords: 이 학생의 탐구활동 소재로 적합한 핵심 키워드 최대 3개 []
7. detectedGpa: 학생부 내용에서 추출해 낸 성적 등급 요약 (예: 국어 1등급, 영어 2등급, 수학 2등급 또는 국1 영2 수2 과1 형태로 간결하게)
8. detectedActivities: 학생부 내용에서 추출해 낸 주요 비교과 활동 요약 (예: 수학동아리 부장, 과학 경시대회 참가 등 간략한 1줄)

응답 형식 (JSON):
{
  "summary": "...",
  "gradeAnalysis": [...],
  "strengths": [...],
  "improvements": [...],
  "finalRecordDraft": "...",
  "studentKeywords": ["키워드1", "키워드2", "키워드3"],
  "detectedGpa": "...",
  "detectedActivities": "..."
}`;
      const gen = await model.generateContent(prompt);
      const text = (await gen.response).text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);

      setResult({
        summary: parsed.summary || fallbackAnalysis(inputText).summary,
        gradeAnalysis: Array.isArray(parsed.gradeAnalysis) ? parsed.gradeAnalysis : fallbackAnalysis(inputText).gradeAnalysis,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallbackAnalysis(inputText).strengths,
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : fallbackAnalysis(inputText).improvements,
        finalRecordDraft: parsed.finalRecordDraft || fallbackAnalysis(inputText).finalRecordDraft,
        studentKeywords: Array.isArray(parsed.studentKeywords) ? parsed.studentKeywords.slice(0, 3) : fallbackAnalysis(inputText).studentKeywords,
      });
      if (parsed.detectedGpa && !gpa) setGpa(parsed.detectedGpa);
      if (parsed.detectedActivities && !activities) setActivities(parsed.detectedActivities);
      setUserKeywords(['', '', '']);
    } catch (e) {
      console.error(e);
      setResult(fallbackAnalysis(inputText));
    } finally {
      setIsScanning(false);
    }
  };

  const saveAnalysis = async () => {
    if (!studentData?.id || !result) return;
    setIsSaving(true);
    try {
      await pb.collection('suprima_pdf_analyses').create({ student_id: studentData.id, content: result });
      await loadHistory();
      alert('분석 결과가 저장되었습니다.');
    } catch (e: any) {
      alert(`저장 실패: ${e?.message || 'unknown'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGoToExploration = () => {
    if (!result) return;
    const data = {
      student: result.studentKeywords,
      user: userKeywords.filter(k => k.trim()),
    };
    sessionStorage.setItem('exploration_keywords', JSON.stringify(data));
    
    // Dispatch a custom event to navigate globally
    window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'exploration' }));
  };

  const printResult = () => {
    window.print();
  };

  // Save Evaluation
  const handleSaveEvaluation = async () => {
    if (!studentData?.id) return;
    if (!evalTitle.trim()) {
      alert('평가서 제목을 입력해 주세요.');
      return;
    }
    setIsSavingEval(true);
    const content = {
      dataType: 'evaluation',
      evalType,
      title: evalTitle,
      semester: evalSemester,
      attitude: evalAttitude,
      inquiry: evalInquiry,
      plan: evalPlan,
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    };
    try {
      if (selectedEval && isEditingEval) {
        // Edit existing
        await pb.collection('suprima_pdf_analyses').update(selectedEval.id, { content });
        alert('평가서가 수정되었습니다.');
      } else {
        // Create new
        await pb.collection('suprima_pdf_analyses').create({
          student_id: studentData.id,
          content
        });
        alert('평가서가 저장되었습니다.');
      }
      setIsEditingEval(false);
      setSelectedEval(null);
      await loadHistory();
    } catch (e: any) {
      alert(`평가서 저장 실패: ${e?.message}`);
    } finally {
      setIsSavingEval(false);
    }
  };

  // Delete Evaluation
  const handleDeleteEvaluation = async (id: string) => {
    if (window.confirm('이 평가서를 정말로 삭제하시겠습니까?')) {
      try {
        await pb.collection('suprima_pdf_analyses').delete(id);
        alert('평가서가 삭제되었습니다.');
        setSelectedEval(null);
        await loadHistory();
      } catch (e: any) {
        alert(`평가서 삭제 실패: ${e?.message}`);
      }
    }
  };

  // Edit Mode Activation
  const handleStartEditEval = (ev: any) => {
    setSelectedEval(ev);
    setEvalType(ev.content.evalType || 'monthly');
    setEvalTitle(ev.content.title || '');
    setEvalSemester(ev.content.semester || '');
    setEvalAttitude(ev.content.attitude || '');
    setEvalInquiry(ev.content.inquiry || '');
    setEvalPlan(ev.content.plan || '');
    setIsEditingEval(true);
  };

  // Create Mode Activation
  const handleStartCreateEval = () => {
    setSelectedEval(null);
    setEvalType('monthly');
    setEvalTitle('');
    setEvalSemester('');
    setEvalAttitude('');
    setEvalInquiry('');
    setEvalPlan('');
    setIsEditingEval(true);
  };

  // Save Planner Data
  const savePlannerData = async (tasks: any[], note: string) => {
    if (!studentData?.id) return;
    const content = {
      dataType: 'planner',
      tasks,
      consultantNote: note
    };
    try {
      if (plannerRecord) {
        await pb.collection('suprima_pdf_analyses').update(plannerRecord.id, { content });
      } else {
        const newRecord = await pb.collection('suprima_pdf_analyses').create({
          student_id: studentData.id,
          content
        });
        setPlannerRecord(newRecord);
      }
      
      // Reload history to keep records updated
      const records = await pb.collection('suprima_pdf_analyses').getFullList({
        filter: `student_id = "${studentData.id}"`,
        sort: '-created',
      });
      setHistory(records);
      const planner = records.find(r => r.content?.dataType === 'planner');
      setPlannerRecord(planner);
    } catch (err: any) {
      console.error('Planner save error:', err);
    }
  };

  // Add Task
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString() + Math.random().toString(),
      text: newTaskText,
      week: newTaskWeek,
      done: false,
    };
    const updated = [...plannerTasks, newTask];
    setPlannerTasks(updated);
    setNewTaskText('');
    savePlannerData(updated, feedbackNote);
  };

  // Toggle Task Status
  const handleToggleTask = (id: string) => {
    const updated = plannerTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setPlannerTasks(updated);
    savePlannerData(updated, feedbackNote);
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    const updated = plannerTasks.filter(t => t.id !== id);
    setPlannerTasks(updated);
    savePlannerData(updated, feedbackNote);
  };

  // Handle File Upload/Change for Task
  const handleFileChangeForTask = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const updated = plannerTasks.map(t => t.id === taskId ? { ...t, fileName: file.name } : t);
      setPlannerTasks(updated);
      savePlannerData(updated, feedbackNote);
      alert(`[${file.name}] 결과물이 과제에 매칭되어 등록되었습니다.`);
    }
  };

  const avg = result?.gradeAnalysis?.length
    ? Math.round(result.gradeAnalysis.reduce((a, b) => a + Number(b.score || 0), 0) / result.gradeAnalysis.length)
    : 0;

  return (
    <div className="student-detail fade-in">
      <header className="detail-header glass-panel">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={20} /></button>
          <div className="student-profile">
            <div className="avatar">{studentData?.name?.[0] || '학'}</div>
            <div className="info">
              <h3>{studentData?.name || '학생'} 종합 케어</h3>
              <span>분석 · 플래닝 · 성과 관리 · 평가서 작성</span>
            </div>
          </div>
        </div>
        <div className="header-tabs">
          <button className={activeView === 'analysis' ? 'active' : ''} onClick={() => setActiveView('analysis')}><Sparkles size={16} /> 1. 학생부 분석</button>
          <button className={activeView === 'planner' ? 'active' : ''} onClick={() => setActiveView('planner')}><ClipboardList size={16} /> 2. 밀착 플래너</button>
          <button className={activeView === 'evaluation' ? 'active' : ''} onClick={() => setActiveView('evaluation')}><FileText size={16} /> 3. 성장 평가서</button>
        </div>
      </header>

      {activeView === 'analysis' && (
        <div className="detail-grid">
          {/* Left panel */}
          <section className="scan-section glass-panel">
            <div className="sub-tabs-container" style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button 
                className={`sub-tab-btn ${activeTab === 'input' ? 'active' : ''}`} 
                onClick={() => setActiveTab('input')}
                style={{
                  background: activeTab === 'input' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 정보 입력 및 스캔
              </button>
              <button 
                className={`sub-tab-btn ${activeTab === 'history' ? 'active' : ''}`} 
                onClick={() => setActiveTab('history')}
                style={{
                  background: activeTab === 'history' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <History size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 분석 이력 ({history.filter(h => !h.content.dataType || h.content.dataType === 'analysis').length})</button>
            </div>
            
            {activeTab === 'input' ? (
              <>
                <div className="section-title"><ClipboardList size={20} /><h3>학생 학업 정보 기입</h3></div>
                
                <div className="info-form">
                  <div className="form-group-inline">
                    <label>희망 전공 (진로)</label>
                    <input type="text" value={hopeMajor} onChange={e => setHopeMajor(e.target.value)} placeholder="예: 컴퓨터공학, 경영학" />
                  </div>
                  <div className="form-group-inline">
                    <label>내신 등급 (국영수과사)</label>
                    <input type="text" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="예: 국1 영2 수2 과1" />
                  </div>
                  <div className="form-group-inline">
                    <label>비교과 활동 요약</label>
                    <input type="text" value={activities} onChange={e => setActivities(e.target.value)} placeholder="예: 수학동아리 기장, 발명대회 수상" />
                  </div>
                </div>

                <div className="section-title" style={{ marginTop: '2rem' }}><FileText size={20} /><h3>학생부 내용 (PDF/직접 입력)</h3></div>
                <div className="upload-box">
                  <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handlePdfUpload} style={{ display: 'none' }} />
                  <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isPdfLoading}>
                    {isPdfLoading ? <RefreshCw className="spin" size={16} /> : <Upload size={16} />}
                    <span>{isPdfLoading ? 'AI PDF 텍스트 추출 중...' : '학생부 PDF 업로드 (AI 텍스트 스캔)'}</span>
                  </button>
                  <span className="upload-hint">NEIS 학생부 PDF 파일을 업로드하면 AI(Gemini)가 텍스트를 정밀하게 추출합니다.</span>
                </div>
                
                <textarea
                  className="student-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="추출된 텍스트가 이곳에 나타납니다. 직접 복사/붙여넣기도 가능합니다."
                />
                
                <div className="actions" style={{ marginTop: '1.5rem' }}>
                  <button className="btn-primary full-width" onClick={runAnalysis} disabled={isScanning} style={{ padding: '1rem', fontSize: '1rem' }}>
                    {isScanning ? <RefreshCw className="spin" size={20} /> : <FileSearch size={20} />}
                    <span>{isScanning ? 'AI 종합 분석 중...' : '학생부 기반 종합 분석 실행'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="analysis-history-list-container">
                <div className="section-title"><History size={18} /><h3>분석 저장 이력</h3></div>
                <div className="history-list">
                  {history.filter(h => !h.content.dataType || h.content.dataType === 'analysis').map((h) => (
                    <div key={h.id} className="history-item" onClick={() => { setResult(h.content as Analysis); setActiveTab('input'); }}>
                      <span className="date">{new Date(h.created).toLocaleString()}</span>
                      <p className="preview">{(h.content?.summary || '요약 없음').slice(0, 70)}...</p>
                      <ChevronRight size={16} />
                    </div>
                  ))}
                  {history.filter(h => !h.content.dataType || h.content.dataType === 'analysis').length === 0 && (
                    <div className="empty-msg">저장된 분석 결과가 없습니다.</div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right panel */}
          <section className="report-section glass-panel">
            <div className="section-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} /><h3>분석 결과 및 키워드 추출</h3></div>
              <div className="action-buttons">
                {result && <button className="icon-action-btn" onClick={printResult} title="출력"><Printer size={18} /></button>}
                {result && <button className="icon-action-btn" onClick={saveAnalysis} disabled={isSaving} title="저장"><Save size={18} /></button>}
              </div>
            </div>

            {result ? (
              <div className="report-content">
                {/* Keywords Section */}
                <div className="keywords-container">
                  <div className="keywords-box ai-keywords">
                    <h4><Sparkles size={16} style={{ display: 'inline', marginRight: '6px' }}/>추출된 핵심 키워드 (최대 3개)</h4>
                    <div className="keyword-tags">
                      {result.studentKeywords?.map((kw, i) => (
                        <span key={i} className="k-tag ai-tag">{kw}</span>
                      ))}
                      {(!result.studentKeywords || result.studentKeywords.length === 0) && <span className="k-tag empty">추출된 키워드 없음</span>}
                    </div>
                  </div>
                  
                  <div className="keywords-box manual-keywords">
                    <h4>사용자 추가 키워드 (직접 입력)</h4>
                    <div className="keyword-inputs">
                      {[0, 1, 2].map(idx => (
                        <input 
                          key={idx}
                          type="text" 
                          value={userKeywords[idx]} 
                          onChange={(e) => {
                            const newK = [...userKeywords];
                            newK[idx] = e.target.value;
                            setUserKeywords(newK);
                          }}
                          placeholder={`추가 키워드 ${idx+1}`}
                          className="k-input"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="exploration-action">
                  <button className="btn-primary highlight-btn full-width" onClick={handleGoToExploration}>
                    <Send size={18} /> 위 키워드들로 탐구활동 주제 제안 받기
                  </button>
                </div>

                <hr className="report-divider" />

                <div className="summary-box">
                  <h4>종합 요약</h4>
                  <p>{result.summary}</p>
                </div>

                <div className="kpi-grid">
                  <div className="kpi-card"><BarChart3 size={16} /><span>평균점수</span><strong>{avg}</strong></div>
                  <div className="kpi-card"><Target size={16} /><span>강점 수</span><strong>{result.strengths.length}</strong></div>
                  <div className="kpi-card"><Target size={16} /><span>보완 수</span><strong>{result.improvements.length}</strong></div>
                </div>

                <div className="report-card">
                  <h4>교과 분석</h4>
                  <table>
                    <thead><tr><th>과목</th><th>점수</th><th>코멘트</th></tr></thead>
                    <tbody>
                      {result.gradeAnalysis.map((g, i) => <tr key={i}><td>{g.subject}</td><td>{g.score}</td><td>{g.comment}</td></tr>)}
                    </tbody>
                  </table>
                </div>

                <div className="two-col">
                  <div className="report-card"><h4>강점</h4><ul>{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                  <div className="report-card"><h4>보완점</h4><ul>{result.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                </div>

                <div className="report-card">
                  <h4>세특 문장 초안</h4>
                  <p>{result.finalRecordDraft}</p>
                </div>
              </div>
            ) : (
              <div className="empty-msg">분석 결과가 없습니다. 왼쪽에서 정보를 입력하고 분석을 실행해 주세요.</div>
            )}
          </section>
        </div>
      )}

      {activeView === 'planner' && (
        <div className="planner-view-container glass-panel" style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
          <div className="planner-header-bar" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><ClipboardList size={20} className="accent-color" /> {studentData?.name} 학생의 밀착 학습/탐구 계획표</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>주차별 과제를 세우고, 학생이 완료하면 탐구 결과물 문서를 업로드해 보관합니다.</span>
          </div>

          <div className="planner-content-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
            {/* Task Checklist Panel */}
            <div className="planner-tasks-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Task Adder Bar */}
              <div className="task-adder-bar" style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <select 
                  value={newTaskWeek} 
                  onChange={(e) => setNewTaskWeek(Number(e.target.value))}
                  style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px' }}
                >
                  <option value={1}>1주차</option>
                  <option value={2}>2주차</option>
                  <option value={3}>3주차</option>
                  <option value={4}>4주차</option>
                </select>
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="이 학생의 이번 주 새로운 탐구/학습 과제를 입력해 주세요..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem' }}
                />
                <button onClick={handleAddTask} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px' }}>
                  <Plus size={16} /> 추가
                </button>
              </div>

              {/* Weekly Groups */}
              <div className="weekly-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3, 4].map((week) => {
                  const weekTasks = plannerTasks.filter(t => t.week === week);
                  return (
                    <div key={week} className="week-group-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
                      <div className="week-group-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <Calendar size={16} className="accent-color" />
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{week}주차 과제</h4>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>{weekTasks.length}개</span>
                      </div>
                      
                      <div className="week-tasks" style={{ display: 'grid', gap: '8px' }}>
                        {weekTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className={`planner-task-item ${task.done ? 'done' : ''}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              opacity: task.done ? 0.8 : 1
                            }}
                          >
                            <div className="task-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              <button 
                                className="checkbox-btn"
                                onClick={() => handleToggleTask(task.id)}
                                style={{ background: 'transparent', border: 'none', color: task.done ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}
                              >
                                {task.done ? <CheckCircle2 size={20} /> : <Square size={20} />}
                              </button>
                              <span className="task-text" style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-muted)' : '#fff', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.text}</span>
                            </div>
                            
                            <div className="task-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                              {task.done && (
                                <div className="file-attachment-section">
                                  {task.fileName ? (
                                    <div 
                                      className="attached-file-badge" 
                                      title="결과물 파일"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'rgba(14,165,233,0.15)',
                                        border: '1px solid rgba(14,165,233,0.3)',
                                        color: '#38bdf8',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      <FileText size={12} />
                                      <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.fileName}</span>
                                      <button 
                                        onClick={() => {
                                          const updated = plannerTasks.map(t => t.id === task.id ? { ...t, fileName: undefined } : t);
                                          setPlannerTasks(updated);
                                          savePlannerData(updated, feedbackNote);
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                                        title="파일 삭제"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="file-upload-trigger">
                                      <label 
                                        htmlFor={`file-input-${task.id}`} 
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          background: 'rgba(255,255,255,0.05)',
                                          border: '1px solid rgba(255,255,255,0.1)',
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          fontSize: '0.8rem',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Upload size={12} /> 결과물 첨부
                                      </label>
                                      <input 
                                        type="file" 
                                        id={`file-input-${task.id}`}
                                        onChange={(e) => handleFileChangeForTask(e, task.id)}
                                        style={{ display: 'none' }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              <button 
                                onClick={() => handleDeleteTask(task.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                                className="delete-task-btn"
                                title="과제 삭제"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {weekTasks.length === 0 && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>이 주차에 배정된 과제가 없습니다.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consultant Feedback Note Panel */}
            <div className="planner-feedback-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="feedback-card glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <ClipboardList size={18} className="accent-color" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>컨설턴트 밀착 지도 피드백</h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>학생의 성취 상황을 모니터링하고 지도 내용을 기록해 학부모 상담 시 활용하세요.</p>
                <textarea
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="이번 달 학생의 과제 수행 상태, 집중 보완이 필요한 영역을 작성해 주세요..."
                  style={{ width: '100%', minHeight: '180px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.9rem', resize: 'vertical' }}
                />
                <button 
                  onClick={() => savePlannerData(plannerTasks, feedbackNote).then(() => alert('피드백이 저장되었습니다.'))}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Save size={16} /> 피드백 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'evaluation' && (
        <div className="eval-view-container" style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '20px', flex: 1, minHeight: 0, padding: '20px', overflow: 'hidden' }}>
          {/* Left panel: list of evaluations */}
          <div className="eval-sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', overflow: 'hidden' }}>
            <div className="sidebar-header-action" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>성장 평가서 목록</h3>
              <button 
                onClick={handleStartCreateEval} 
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={12} /> 신규 작성
              </button>
            </div>
            
            <div className="eval-list" style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: '10px', alignContent: 'start' }}>
              {evaluationHistory.map((ev) => (
                <div 
                  key={ev.id} 
                  className={`eval-list-item ${selectedEval?.id === ev.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEval(ev);
                    setIsEditingEval(false);
                  }}
                  style={{
                    background: selectedEval?.id === ev.id ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.02)',
                    border: selectedEval?.id === ev.id ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="eval-badge-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span 
                      className={`eval-badge ${ev.content.evalType}`}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        background: ev.content.evalType === 'semester' ? 'rgba(244,63,94,0.15)' : ev.content.evalType === 'quarterly' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.15)',
                        color: ev.content.evalType === 'semester' ? '#f43f5e' : ev.content.evalType === 'quarterly' ? '#38bdf8' : '#10b981'
                      }}
                    >
                      {ev.content.evalType === 'monthly' && '월말평가'}
                      {ev.content.evalType === 'quarterly' && '분기평가'}
                      {ev.content.evalType === 'semester' && '학기평가'}
                    </span>
                    <span className="eval-date" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.content.date}</span>
                  </div>
                  <h4 className="eval-item-title" style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.content.title}</h4>
                  <p className="eval-item-semester" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ev.content.semester || '학기 미정'}</p>
                </div>
              ))}
              {evaluationHistory.length === 0 && (
                <div className="empty-sidebar-msg" style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={24} style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.2)' }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>등록된 성장 평가서가 없습니다.<br />우측 상단의 '신규 작성' 버튼을 눌러보세요.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: editor or display card */}
          <div className="eval-main-panel glass-panel" style={{ height: '100%', padding: '20px', overflowY: 'auto' }}>
            {isEditingEval ? (
              <div className="eval-editor-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{selectedEval ? '성장 평가서 수정' : '새로운 성장 평가서 작성'}</h4>
                </div>
                
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>평가 구분</label>
                    <select 
                      value={evalType} 
                      onChange={(e) => setEvalType(e.target.value as any)}
                      style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px' }}
                    >
                      <option value="monthly">월말평가서</option>
                      <option value="quarterly">분기평가서</option>
                      <option value="semester">학기평가서</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>기준 학년/학기</label>
                    <input 
                      type="text" 
                      value={evalSemester}
                      onChange={(e) => setEvalSemester(e.target.value)}
                      placeholder="예: 2학년 1학기"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>평가서 제목</label>
                  <input 
                    type="text" 
                    value={evalTitle}
                    onChange={(e) => setEvalTitle(e.target.value)}
                    placeholder="예: 5월 교과학습 및 탐구 보고서 평가서"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>1. 학습 태도 및 수업 참여도 분석</label>
                  <textarea 
                    value={evalAttitude}
                    onChange={(e) => setEvalAttitude(e.target.value)}
                    placeholder="학생이 수업 중 보인 적극성, 경청하는 자세, 과제 성실성 등을 구체적인 관찰 내용 중심으로 작성해 주세요..."
                    style={{ minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>2. 주제 탐구 및 과제 수행 역량 평가</label>
                  <textarea 
                    value={evalInquiry}
                    onChange={(e) => setEvalInquiry(e.target.value)}
                    placeholder="제안받은 탐구활동을 주도적으로 구현했는지, 데이터나 도서를 적절히 활용해 완성도 높은 결과물을 도출했는지 기술해 주세요..."
                    style={{ minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>3. 향후 학습 및 입시 코칭 중점 계획</label>
                  <textarea 
                    value={evalPlan}
                    onChange={(e) => setEvalPlan(e.target.value)}
                    placeholder="다음 평가 시기까지 성적을 개선하거나 세특 심화 주제를 발전시키기 위한 액션 플랜을 제시해 주세요..."
                    style={{ minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button 
                    onClick={handleSaveEvaluation} 
                    disabled={isSavingEval}
                    className="btn-primary"
                    style={{ padding: '10px 20px' }}
                  >
                    {isSavingEval ? '저장 중...' : '평가서 저장'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingEval(false);
                      if (!selectedEval && evaluationHistory.length > 0) {
                        setSelectedEval(evaluationHistory[0]);
                      }
                    }} 
                    className="btn-secondary"
                    style={{ padding: '10px 20px' }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : selectedEval ? (
              <div className="eval-detail-view">
                <div className="detail-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div className="title-section">
                    <span 
                      className={`eval-badge ${selectedEval.content.evalType}`}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        display: 'inline-block',
                        marginBottom: '6px',
                        background: selectedEval.content.evalType === 'semester' ? 'rgba(244,63,94,0.15)' : selectedEval.content.evalType === 'quarterly' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.15)',
                        color: selectedEval.content.evalType === 'semester' ? '#f43f5e' : selectedEval.content.evalType === 'quarterly' ? '#38bdf8' : '#10b981'
                      }}
                    >
                      {selectedEval.content.evalType === 'monthly' && '월말평가'}
                      {selectedEval.content.evalType === 'quarterly' && '분기평가'}
                      {selectedEval.content.evalType === 'semester' && '학기평가'}
                    </span>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#fff' }}>{selectedEval.content.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>기준 학기: {selectedEval.content.semester} · 작성일자: {selectedEval.content.date}</p>
                  </div>
                  
                  <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setPrintEval(selectedEval)}
                      className="icon-action-btn"
                      title="PDF 출력/인쇄"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      onClick={() => handleStartEditEval(selectedEval)}
                      className="icon-action-btn"
                      title="수정"
                    >
                      <Save size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteEvaluation(selectedEval.id)}
                      className="icon-action-btn"
                      style={{ color: 'var(--text-muted)' }}
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <hr className="report-divider" style={{ margin: '16px 0' }} />

                <div className="eval-content-sections" style={{ display: 'grid', gap: '16px' }}>
                  <div className="eval-section-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="section-number" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(14,165,233,0.15)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>1</span>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>학습 태도 및 수업 참여도 분석</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedEval.content.attitude || '작성된 내용이 없습니다.'}</p>
                  </div>

                  <div className="eval-section-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="section-number" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(14,165,233,0.15)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>2</span>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>주제 탐구 및 과제 수행 역량 평가</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedEval.content.inquiry || '작성된 내용이 없습니다.'}</p>
                  </div>

                  <div className="eval-section-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="section-number" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(14,165,233,0.15)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>3</span>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>향후 학습 및 입시 코칭 중점 계획</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedEval.content.plan || '작성된 내용이 없습니다.'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-main-msg" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ marginBottom: '12px', color: 'rgba(255,255,255,0.15)' }} />
                <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 6px 0' }}>성장 평가서를 관리합니다</h3>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>왼쪽 목록에서 평가서를 선택하거나 '신규 작성'을 눌러 새로운 보고서를 발행해 보세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print Preview Overlay */}
      {printEval && (
        <div className="print-preview-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div className="print-control-box" style={{
            width: '100%',
            maxWidth: '800px',
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>인쇄 미리보기</span>
            <div className="print-controls" style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-primary" 
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.88rem' }}
              >
                <Printer size={14} /> 즉시 인쇄 (A4)
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setPrintEval(null)}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              >
                닫기
              </button>
            </div>
          </div>
          
          <div className="print-page A4 print-section" style={{
            width: '210mm',
            minHeight: '297mm',
            background: '#fff',
            color: '#1e293b',
            padding: '20mm',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'sans-serif'
          }}>
            <div className="print-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 20px 0', letterSpacing: '2px', borderBottom: '2px double #1e293b', paddingBottom: '10px', color: '#0f172a' }}>학습 및 탐구 성장 평가서</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #94a3b8', fontSize: '0.9rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '15%', background: '#f8fafc', fontWeight: 700, padding: '8px', border: '1px solid #94a3b8', textAlign: 'center' }}>학생명</td>
                    <td style={{ width: '35%', padding: '8px', border: '1px solid #94a3b8' }}>{studentData?.name}</td>
                    <td style={{ width: '15%', background: '#f8fafc', fontWeight: 700, padding: '8px', border: '1px solid #94a3b8', textAlign: 'center' }}>평가 구분</td>
                    <td style={{ width: '35%', padding: '8px', border: '1px solid #94a3b8' }}>
                      {printEval.content.evalType === 'monthly' && '월말평가 보고서'}
                      {printEval.content.evalType === 'quarterly' && '분기평가 보고서'}
                      {printEval.content.evalType === 'semester' && '학기평가 보고서'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ background: '#f8fafc', fontWeight: 700, padding: '8px', border: '1px solid #94a3b8', textAlign: 'center' }}>대상 학기</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{printEval.content.semester || '해당 없음'}</td>
                    <td style={{ background: '#f8fafc', fontWeight: 700, padding: '8px', border: '1px solid #94a3b8', textAlign: 'center' }}>발행일자</td>
                    <td style={{ padding: '8px', border: '1px solid #94a3b8' }}>{printEval.content.date}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="print-body" style={{ flex: 1, display: 'grid', gap: '20px', alignContent: 'start', margin: '10px 0' }}>
              <div className="print-section-box" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>1. 학습 태도 및 참여도 분석</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{printEval.content.attitude || '기록 없음'}</p>
              </div>

              <div className="print-section-box" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>2. 주제 탐구 및 수행 역량 평가</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{printEval.content.inquiry || '기록 없음'}</p>
              </div>

              <div className="print-section-box" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>3. 향후 학습 및 입시 코칭 중점 계획</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{printEval.content.plan || '기록 없음'}</p>
              </div>
            </div>

            <div className="print-footer" style={{ borderTop: '2px solid #0f172a', paddingTop: '15px', marginTop: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: '#475569' }}>위와 같이 학생의 학업 성장을 진단하고 향후 계획을 전달합니다.</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>수프리마(Suprema) 입시컨설팅 센터</span>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px red solid', color: 'red', fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: '0.8rem', transform: 'rotate(-10deg)', userSelect: 'none' }}>인</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
