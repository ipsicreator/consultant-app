import React, { useState } from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  BrainCircuit,
  MessageSquare,
  FileText,
  RotateCcw
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './ExplorationModule.css';

interface ExplorationModuleProps {
  onBack: () => void;
  studentData: { id: string, name: string } | null;
}

const ExplorationModule: React.FC<ExplorationModuleProps> = ({ onBack, studentData }) => {
  const [interest, setInterest] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const handleGenerate = async () => {
    if (!interest) return alert('탐구하고 싶은 주제나 관심사를 입력해주세요.');
    
    setIsGenerating(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        학생의 관심사: "${interest}"
        추가 컨텍스트: "${extraContext}"
        이 학생을 위해 대학 입시(수시 학종)에서 경쟁력을 가질 수 있는 심화 탐구 주제 3가지를 제안해줘.
        
        각 제안은 반드시 다음 JSON 형식의 배열로 응답해:
        [{
          "title": "주제 제목",
          "motivation": "탐구 동기 및 배경 (학생부 연결고리)",
          "steps": ["1단계 활동 내용", "2단계 활동 내용", "3단계 활동 내용"],
          "recordDraft": "생기부 세특 기재 예시 (전문적이고 학술적인 문체)"
        }]
        
        응답은 반드시 순수 JSON 데이터만 보내줘. 한글로 작성해.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(jsonStr);
      setProposals(data);
    } catch (error) {
      console.error('AI 생성 오류:', error);
      alert('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="exploration-module fade-in">
      <header className="module-header glass-panel">
        <div className="header-left">
          <button className="back-btn-small" onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
            뒤로가기
          </button>
          <BrainCircuit className="header-icon" size={28} />
          <div className="title-area">
            <h2>AI 탐구 브레인</h2>
            <p>관심사와 학생부 데이터를 융합하여 심화 탐구 경로를 설계합니다.</p>
          </div>
        </div>
        {studentData && (
          <div className="student-badge">
            <span className="name">{studentData.name} 학생</span>
            <span className="label">분석 중</span>
          </div>
        )}
      </header>

      <div className="module-grid">
        <section className="input-section glass-panel">
          <div className="section-title">
            <Lightbulb size={20} />
            <h3>탐구 설계 입력</h3>
          </div>

          <div className="input-group">
            <label>주요 관심사 및 탐구 키워드</label>
            <input 
              type="text" 
              placeholder="예: 양자 역학의 보안 기술 활용, ESG 경영의 실효성 등"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>추가 컨텍스트 (선택 사항)</label>
            <textarea 
              placeholder="구체적인 아이디어를 입력하세요."
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              rows={6}
            />
          </div>

          <div className="action-area">
            <button 
              className={`generate-btn ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="spin" size={18} />
                  <span>AI 분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>심화 탐구 제안 생성</span>
                </>
              )}
            </button>
          </div>
        </section>

        <section className="results-section">
          {proposals.length === 0 ? (
            <div className="empty-results glass-panel">
              <div className="pulse-icon">
                <MessageSquare size={48} />
              </div>
              <h3>AI의 제안을 기다리고 있습니다</h3>
            </div>
          ) : (
            <div className="proposals-list">
              {proposals.map((item, idx) => (
                <div key={idx} className={`proposal-card glass-panel ${expandedIndex === idx ? 'expanded' : ''}`}>
                  <div className="card-header" onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}>
                    <div className="header-main">
                      <span className="idx">0{idx + 1}</span>
                      <h4>{item.title}</h4>
                    </div>
                    {expandedIndex === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                  <div className="card-content">
                    <div className="content-group">
                      <h5><ArrowRight size={14} /> 탐구 동기 및 추진 배경</h5>
                      <p>{item.motivation}</p>
                    </div>

                    <div className="content-group">
                      <h5><BrainCircuit size={14} /> 심화 탐구 로직 (Step-by-Step)</h5>
                      <ul className="step-list">
                        {item.steps.map((step: string, sIdx: number) => (
                          <li key={sIdx}>
                            <span className="step-num">{sIdx + 1}</span>
                            <span className="step-text">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="draft-box">
                      <div className="draft-header">
                        <h5><FileText size={14} /> 생기부 세특 기재 초안</h5>
                        <button className="copy-btn" onClick={() => handleCopy(item.recordDraft, idx)}>
                          {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedIndex === idx ? '복사됨' : '초안 복사'}</span>
                        </button>
                      </div>
                      <div className="draft-content">
                        "{item.recordDraft}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ExplorationModule;
