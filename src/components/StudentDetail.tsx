import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileSearch, 
  Save, 
  FileText,
  RefreshCw,
  Sparkles,
  History,
  ClipboardList,
  ChevronRight
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pb } from '../lib/pocketbase';
import './StudentDetail.css';

interface StudentDetailProps {
  studentData: { id: string; name: string } | null;
  onBack: () => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ studentData, onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [pastAnalyses, setPastAnalyses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  useEffect(() => {
    if (studentData) {
      fetchPastAnalyses();
    }
  }, [studentData]);

  const fetchPastAnalyses = async () => {
    try {
      const records = await pb.collection('pdf_analyses').getFullList({
        filter: `student_id = "${studentData?.id}"`,
        sort: '-created',
      });
      setPastAnalyses(records);
      if (records.length > 0 && !analysisResult) {
        setAnalysisResult(records[0].content);
      }
    } catch (error) {
      console.error("Fetch past analyses error:", error);
    }
  };

  const handleStartScan = async () => {
    if (!inputText.trim()) return alert("분석할 텍스트를 입력하거나 PDF를 업로드해주세요.");

    setIsScanning(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        다음은 고등학생의 학교생활기록부 내용이야:
        "${inputText}"
        
        이 내용을 분석해서 다음 정보를 추출해줘:
        1. 종합 핵심 요약
        2. 주요 교과 성적 및 세특 분석
        3. 비교과 활동 요약
        
        결과는 반드시 JSON 형식으로 응답해.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(jsonStr);
      
      setAnalysisResult(data);
      alert("AI 분석이 완료되었습니다.");
    } catch (error) {
      console.error("AI 분석 오류:", error);
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveResult = async () => {
    if (!studentData || !analysisResult) return;

    setIsSaving(true);
    try {
      await pb.collection('pdf_analyses').create({
        student_id: studentData.id,
        content: analysisResult,
      });
      alert("저장되었습니다.");
      fetchPastAnalyses();
      setActiveTab('history');
    } catch (error: any) {
      alert("저장 실패: " + error.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="student-detail fade-in">
      <header className="detail-header glass-panel">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div className="student-profile">
            <div className="avatar">{studentData?.name[0]}</div>
            <div className="info">
              <h3>{studentData?.name}</h3>
              <span>학생부 정밀 분석 워크스테이션</span>
            </div>
          </div>
        </div>
        <div className="header-tabs">
          <button className={activeTab === 'new' ? 'active' : ''} onClick={() => setActiveTab('new')}>
            <Sparkles size={16} /> 새 분석
          </button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
            <History size={16} /> 이력 ({pastAnalyses.length})
          </button>
        </div>
      </header>

      <div className="detail-grid">
        {activeTab === 'new' ? (
          <section className="scan-section glass-panel">
            <div className="section-title">
              <ClipboardList size={20} />
              <h3>텍스트 입력</h3>
            </div>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="생기부 내용을 입력하세요..."
            />
            <div className="actions">
              <button className="btn-primary" onClick={handleStartScan} disabled={isScanning}>
                {isScanning ? <RefreshCw className="spin" size={18} /> : <FileSearch size={18} />}
                <span>{isScanning ? '분석 중...' : 'AI 분석 시작'}</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="history-section glass-panel">
            <div className="history-list">
              {pastAnalyses.map((item) => (
                <div key={item.id} className="history-item" onClick={() => { setAnalysisResult(item.content); setActiveTab('new'); }}>
                  <span className="date">{new Date(item.created).toLocaleDateString()}</span>
                  <p className="preview">{item.content.analysis_summary?.slice(0, 50)}...</p>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="report-section glass-panel">
          <div className="section-title">
            <FileText size={20} />
            <h3>분석 리포트</h3>
            {analysisResult && (
              <button className="btn-save" onClick={handleSaveResult} disabled={isSaving}>
                <Save size={16} /> {isSaving ? '저장 중' : '저장'}
              </button>
            )}
          </div>
          {analysisResult ? (
            <div className="report-content">
              <div className="report-card">
                <h4>종합 요약</h4>
                <p>{analysisResult.analysis_summary}</p>
              </div>
              <div className="report-card">
                <h4>교과 분석</h4>
                <table>
                  <thead>
                    <tr><th>과목</th><th>등급</th><th>포인트</th></tr>
                  </thead>
                  <tbody>
                    {analysisResult.grades?.map((g: any, i: number) => (
                      <tr key={i}>
                        <td>{g.subject}</td>
                        <td>{g.score}</td>
                        <td>{g.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-msg">분석 결과가 여기에 표시됩니다.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDetail;
