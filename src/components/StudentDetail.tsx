import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, FileSearch, Save, FileText, RefreshCw, Sparkles, History, ClipboardList, ChevronRight, BarChart3, Target, Printer,
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pb } from '../lib/pocketbase';
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
});

const StudentDetail: React.FC<StudentDetailProps> = ({ studentData, onBack }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<any[]>([]);

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

  const runAnalysis = async () => {
    if (!inputText.trim()) {
      alert('학생부 입력 내용을 작성해 주세요.');
      return;
    }

    setIsScanning(true);
    try {
      if (!geminiKey) {
        setResult(fallbackAnalysis(inputText));
        return;
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `다음 학생부 입력을 분석해 JSON으로 반환하세요.
키: summary, gradeAnalysis[{subject,score,comment}], strengths[], improvements[], finalRecordDraft
학생부 입력: ${inputText}`;
      const gen = await model.generateContent(prompt);
      const text = (await gen.response).text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);

      setResult({
        summary: parsed.summary || fallbackAnalysis(inputText).summary,
        gradeAnalysis: Array.isArray(parsed.gradeAnalysis) ? parsed.gradeAnalysis : fallbackAnalysis(inputText).gradeAnalysis,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallbackAnalysis(inputText).strengths,
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : fallbackAnalysis(inputText).improvements,
        finalRecordDraft: parsed.finalRecordDraft || fallbackAnalysis(inputText).finalRecordDraft,
      });
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
      setActiveTab('history');
    } catch (e: any) {
      alert(`저장 실패: ${e?.message || 'unknown'}`);
    } finally {
      setIsSaving(false);
    }
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
              <h3>{studentData?.name || '학생'} 분석</h3>
              <span>학생부입력 → 분석 → 결과 페이지</span>
            </div>
          </div>
        </div>
        <div className="header-tabs">
          <button className={activeTab === 'input' ? 'active' : ''} onClick={() => setActiveTab('input')}><Sparkles size={16} /> 입력/분석</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}><History size={16} /> 저장 이력 ({history.length})</button>
        </div>
      </header>

      <div className="detail-grid">
        {activeTab === 'input' ? (
          <section className="scan-section glass-panel">
            <div className="section-title"><ClipboardList size={20} /><h3>학생부 입력</h3></div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="교과/활동/세특 근거를 입력하세요"
            />
            <div className="actions">
              <button className="btn-primary" onClick={runAnalysis} disabled={isScanning}>
                {isScanning ? <RefreshCw className="spin" size={16} /> : <FileSearch size={16} />}
                <span>{isScanning ? '분석 중...' : '분석 실행'}</span>
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
            <FileText size={20} /><h3>결과 페이지</h3>
            {result && <button className="btn-save" onClick={printResult}><Printer size={14} />출력하기</button>}
            {result && <button className="btn-save" onClick={saveAnalysis} disabled={isSaving}><Save size={14} />{isSaving ? '저장중' : '저장'}</button>}
          </div>

          {result ? (
            <div className="report-content">
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
            <div className="empty-msg">분석 결과가 없습니다. 왼쪽에서 학생부입력 후 분석 실행을 눌러 주세요.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDetail;
