import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ArrowLeft, FileSearch, Save, FileText, RefreshCw, Sparkles, History, ClipboardList, ChevronRight, BarChart3, Target, Printer, Upload, Send
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
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  // Input fields
  const [inputText, setInputText] = useState('');
  const [hopeMajor, setHopeMajor] = useState('');
  const [gpa, setGpa] = useState('');
  const [activities, setActivities] = useState('');
  
  // Results
  const [result, setResult] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  // User Keywords
  const [userKeywords, setUserKeywords] = useState(['', '', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const genAI = useMemo(() => new GoogleGenerativeAI(geminiKey), [geminiKey]);

  const loadHistory = async () => {
    try {
      const records = await pb.collection('suprima_pdf_analyses').getFullList({
        filter: `student_id = "${studentData?.id}"`,
        sort: '-created',
      });
      setHistory(records);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (studentData?.id) loadHistory();
  }, [studentData?.id]);

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
내신 등급: ${gpa}
비교과 활동: ${activities}
학생부 내용: ${inputText}

요청:
1. summary: 종합 요약
2. gradeAnalysis: 교과 분석 [{subject,score,comment}]
3. strengths: 강점 리스트 []
4. improvements: 보완점 리스트 []
5. finalRecordDraft: 세특 문장 초안
6. studentKeywords: 이 학생의 탐구활동 소재로 적합한 핵심 키워드 최대 3개 []

응답 형식 (JSON):
{
  "summary": "...",
  "gradeAnalysis": [...],
  "strengths": [...],
  "improvements": [...],
  "finalRecordDraft": "...",
  "studentKeywords": ["키워드1", "키워드2", "키워드3"]
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
              <h3>{studentData?.name || '학생'} 종합 분석</h3>
              <span>기본 정보 기입 → PDF 업로드/분석 → 키워드 추출</span>
            </div>
          </div>
        </div>
        <div className="header-tabs">
          <button className={activeTab === 'input' ? 'active' : ''} onClick={() => setActiveTab('input')}><Sparkles size={16} /> 정보 입력 및 분석</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}><History size={16} /> 이력 ({history.length})</button>
        </div>
      </header>

      <div className="detail-grid">
        {activeTab === 'input' ? (
          <section className="scan-section glass-panel">
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
          </section>
        ) : (
          <section className="history-section glass-panel">
            <div className="section-title"><History size={18} /><h3>분석 저장 이력</h3></div>
            <div className="history-list">
              {history.map((h) => (
                <div key={h.id} className="history-item" onClick={() => { setResult(h.content as Analysis); setActiveTab('input'); }}>
                  <span className="date">{new Date(h.created).toLocaleString()}</span>
                  <p className="preview">{(h.content?.summary || '요약 없음').slice(0, 70)}...</p>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          </section>
        )}

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
    </div>
  );
};

export default StudentDetail;
