import React, { useMemo, useState } from 'react';
import { Lightbulb, BookOpen, Sparkles, Send, RefreshCw, X, ArrowLeft, Calendar } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SUBJECTS, DEFAULT_CATEGORY_MAP } from '../lib/explorationConfig';
import './ExplorationModule.css';

interface ExplorationModuleProps {
  onBack: () => void;
  studentData: { id: string; name: string } | null;
}

type Suggestion = {
  title: string;
  objective: string;
  reading: { bookTitle: string; reason: string };
  activitySteps: string[];
  output: string;
};

const fallbackSuggestions = (a: string, b: string, c: string, d: string): Suggestion[] => [
  {
    title: `${a} × ${c} 융합 탐구`,
    objective: `${a} 기반 역량을 ${c} 관점으로 확장`,
    reading: { bookTitle: `${a}를 바꾸는 생각법`, reason: `${a} 기초개념과 실제 적용 프레임 확보` },
    activitySteps: ['핵심 개념 3개 정리', '학교 사례 1개 데이터화', '개선안 발표 슬라이드 작성'],
    output: '세특 문장 초안 + 탐구 보고서 1p',
  },
  {
    title: `${b} 중심 문제해결 프로젝트`,
    objective: `${b} 이슈를 ${d} 방식으로 해결`,
    reading: { bookTitle: `${b} 인사이트 리포트`, reason: `문제 정의/가설 설정 역량 강화` },
    activitySteps: ['문제 정의', '가설 수립', '실험/조사', '결론 정리'],
    output: '탐구활동 기록지 + 발표 대본',
  },
  {
    title: `실생활 연계 ${a} 모델링`,
    objective: `교과 지식을 실생활 사회 문제에 적용`,
    reading: { bookTitle: `일상 속의 ${a}`, reason: `실생활 적용 아이디어 발굴` },
    activitySteps: ['문헌 조사', '가설 모델링', '시뮬레이션'],
    output: '소논문 형태의 결과 보고서',
  },
  {
    title: `${c} 트렌드 분석 보고서`,
    objective: `최신 연구 동향 파악 및 진로 연관성 어필`,
    reading: { bookTitle: `2025 ${c} 트렌드`, reason: `최신 기술 동향 이해` },
    activitySteps: ['논문 요약', '전문가 인터뷰 요약', '향후 발전 방향 제시'],
    output: '심화 탐구 에세이',
  }
];

const ExplorationModule: React.FC<ExplorationModuleProps> = ({ studentData, onBack }) => {
  const getInitialKeywords = () => {
    try {
      const stored = sessionStorage.getItem('exploration_keywords');
      return stored && stored !== 'undefined' ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  };
  const initialKeywords = getInitialKeywords();
  
  // Admin Map Tabs State
  const [activeSubject, setActiveSubject] = useState('과학');
  
  // Generator Form State
  const [genSubject, setGenSubject] = useState('국어');
  const [genGrade, setGenGrade] = useState('1학년');
  
  const [studentKeyword1, setStudentKeyword1] = useState(initialKeywords.student?.[0] || '');
  const [studentKeyword2, setStudentKeyword2] = useState(initialKeywords.student?.[1] || '');
  const [studentKeyword3, setStudentKeyword3] = useState(initialKeywords.student?.[2] || '');
  const [userKeyword1, setUserKeyword1] = useState(initialKeywords.user?.[0] || '');
  const [userKeyword2, setUserKeyword2] = useState(initialKeywords.user?.[1] || '');
  const [userKeyword3, setUserKeyword3] = useState(initialKeywords.user?.[2] || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Suggestion[] | null>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const genAI = useMemo(() => new GoogleGenerativeAI(apiKey), [apiKey]);

  const generate = async () => {
    const sKeys = [studentKeyword1, studentKeyword2, studentKeyword3].filter(k => k.trim());
    const uKeys = [userKeyword1, userKeyword2, userKeyword3].filter(k => k.trim());
    
    if (sKeys.length === 0 && uKeys.length === 0) {
      alert('최소 1개 이상의 키워드를 입력해 주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      if (!apiKey) {
        setTimeout(() => {
          setResult(fallbackSuggestions(sKeys[0]||'데이터', sKeys[1]||'발표', uKeys[0]||'AI', uKeys[1]||'사회문제'));
          setIsGenerating(false);
        }, 1500);
        return;
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `학생명: ${studentData?.name || '학생'}
[탐구 조건]
- 교과군: ${genSubject}
- 학년: ${genGrade}
- 학생부 추출 핵심 키워드: ${sKeys.join(', ')}
- 컨설턴트 추가(진로/관심사) 키워드: ${uKeys.join(', ')}

위 조건과 키워드들을 완벽하게 융합하여, 입학사정관의 눈길을 사로잡을 수 있는 고품질의 [심화 탐구활동 주제]를 정확히 4개 생성해줘.

조건:
- 학생의 학년(${genGrade}) 수준에 맞는 깊이여야 함.
- 선택된 교과군(${genSubject})의 성취기준 및 키워드의 맥락과 완벽히 직결되어야 함.
- 각 주제는 서로 다른 접근 방식(예: 실험형, 문헌조사형, 데이터분석형, 독서융합형)을 가져야 함.
- 반드시 추천 독서 1권을 매핑해야 함.

다음 JSON 형식으로만 완벽하게 반환해줘:
[
  {
    "title": "주제명 (구체적이고 매력적으로)",
    "objective": "탐구 목적 및 역량 어필 포인트 (1-2줄)",
    "reading": { "bookTitle": "추천 도서명", "reason": "이 책을 읽어야 하는 이유" },
    "activitySteps": ["단계1", "단계2", "단계3", "단계4"],
    "output": "최종 산출물 형태 (예: 2페이지 탐구보고서, 발표 슬라이드)"
  }
]`;
      
      const raw = (await (await model.generateContent(prompt)).response).text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || raw);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        setResult(parsed);
      } else {
        setResult(fallbackSuggestions(sKeys[0]||'데이터', sKeys[1]||'발표', uKeys[0]||'AI', uKeys[1]||'사회문제'));
      }
    } catch (e) {
      console.error(e);
      setResult(fallbackSuggestions(sKeys[0]||'데이터', sKeys[1]||'발표', uKeys[0]||'AI', uKeys[1]||'사회문제'));
    } finally {
      setIsGenerating(false);
    }
  };

  const currentMapCards = DEFAULT_CATEGORY_MAP[activeSubject] || DEFAULT_CATEGORY_MAP['과학'];

  return (
    <div className="explore-wrap fade-in">
      
      {/* 1층 - Top Title & Subject Tabs */}
      <div className="top-layer">
        <div className="top-title-bar">
          <button className="back-btn-explore" onClick={onBack}><ArrowLeft size={20} /> 돌아가기</button>
          <h2><Sparkles size={20} /> 주제탐구 활동 생성기</h2>
        </div>

        <div className="subject-tabs">
          {SUBJECTS.map(sub => (
            <button 
              key={sub} 
              className={`subject-tab ${activeSubject === sub ? 'active' : ''}`}
              onClick={() => setActiveSubject(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* 2층 - 교과 탐구 지도 */}
      <div className="middle-layer map-layer">
        <div className="map-header">
          <h3 className="map-main-title">교과 탐구 지도</h3>
          <p className="map-sub-title">교과 개념을 탐구 질문으로 바꾸는 연결 지도</p>
        </div>

        <div className="explore-grid">
          {currentMapCards.map((card, idx) => (
            <div key={idx} className="map-card glass-panel">
              <span className="card-tag">{card.title}</span>
              <h4 className="card-subtitle">{card.subtitle}</h4>
              <p className="card-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>



      {/* 3. Input Section (Generator) */}
      <section className="explore-input-section bottom-generator">
        <div className="input-header">
          <p className="generator-hint">교과, 학년 및 추출된 키워드를 기반으로 4~5개의 완벽한 심화 탐구 주제를 뽑아냅니다.</p>
        </div>

        <div className="generator-filters">
          <div className="filter-group">
            <label>교과군</label>
            <select value={genSubject} onChange={(e) => setGenSubject(e.target.value)}>
              <option value="국어">국어</option>
              <option value="영어">영어</option>
              <option value="수학">수학</option>
              <option value="사회탐구">사회탐구</option>
              <option value="과학탐구">과학탐구</option>
              <option value="정보">정보</option>
            </select>
          </div>
          <div className="filter-group">
            <label>학년</label>
            <select value={genGrade} onChange={(e) => setGenGrade(e.target.value)}>
              <option value="1학년">1학년</option>
              <option value="2학년">2학년</option>
              <option value="3학년">3학년</option>
            </select>
          </div>
        </div>

        <div className="keyword-matrix">
          <div className="keyword-col">
            <label className="col-label">학생부 추출 키워드</label>
            <input placeholder="키워드 1" value={studentKeyword1} onChange={(e) => setStudentKeyword1(e.target.value)} />
            <input placeholder="키워드 2" value={studentKeyword2} onChange={(e) => setStudentKeyword2(e.target.value)} />
            <input placeholder="키워드 3" value={studentKeyword3} onChange={(e) => setStudentKeyword3(e.target.value)} />
          </div>
          <div className="keyword-col">
            <label className="col-label">사용자 추가 키워드 (진로/관심사)</label>
            <input placeholder="키워드 1" value={userKeyword1} onChange={(e) => setUserKeyword1(e.target.value)} />
            <input placeholder="키워드 2" value={userKeyword2} onChange={(e) => setUserKeyword2(e.target.value)} />
            <input placeholder="키워드 3" value={userKeyword3} onChange={(e) => setUserKeyword3(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary generate-btn" onClick={generate} disabled={isGenerating}>
          {isGenerating ? <RefreshCw className="spin" size={20} /> : <Send size={20} />}
          <span>{isGenerating ? 'AI가 학생 맞춤형 탐구 주제를 4~5개 설계 중입니다...' : '새로운 창에서 탐구활동 제안 4~5개 생성하기'}</span>
        </button>
      </section>

      {/* 5. Result Modal (Fullscreen) */}
      {result && (
        <div className="result-modal-overlay fade-in">
          <div className="result-modal-content">
            <header className="result-modal-header">
              <div className="header-titles">
                <h2><Lightbulb size={24} /> 맞춤형 심화 탐구활동 제안서</h2>
                <p>{studentData?.name || '학생'}님을 위해 AI가 설계한 완벽한 융합 탐구 주제들입니다.</p>
              </div>
              <button className="icon-btn close-modal" onClick={() => setResult(null)}>
                <X size={28} />
              </button>
            </header>

            <div className="result-modal-body">
              <div className="result-grid">
                {result.map((s: Suggestion, i: number) => (
                  <article key={i} className="result-card">
                    <div className="rcard-header">
                      <span className="rcard-badge">제안 {i + 1}</span>
                      <h3>{s.title}</h3>
                    </div>
                    <div className="rcard-body">
                      <p className="rcard-objective"><strong>목표:</strong> {s.objective}</p>
                      
                      <div className="rcard-reading">
                        <strong><BookOpen size={16} /> 추천 독서 연계</strong>
                        <div className="reading-box">
                          <p className="b-title">{s.reading?.bookTitle}</p>
                          <p className="b-reason">{s.reading?.reason}</p>
                        </div>
                      </div>

                      <div className="rcard-steps">
                        <strong>탐구 진행 단계</strong>
                        <ol>
                          {(s.activitySteps || []).map((st: string, idx: number) => <li key={idx}>{st}</li>)}
                        </ol>
                      </div>

                      <div className="rcard-output">
                        <strong>최종 산출물:</strong> {s.output}
                      </div>

                      <button 
                        className="btn-primary" 
                        style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('TRANSFER_TO_PLANNER', { detail: { title: s.title } }));
                          window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'planner' }));
                        }}
                      >
                        <Calendar size={18} />
                        이 주제를 플래너로 즉시 전송하기
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Floating Button to Inquiry Guide */}
      <button 
        className="floating-guide-btn fade-in"
        onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'inquiry_guide' }))}
        title="심화탐구 가이드(연결지도)로 이동"
      >
        <BookOpen size={24} />
        <span>심화탐구 연결지도 펼치기</span>
      </button>
    </div>
  );
};

export default ExplorationModule;
