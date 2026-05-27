import React, { useMemo, useState } from 'react';
import { Lightbulb, BookOpen, Sparkles, Send, RefreshCw, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

const SUBJECTS = ['국어', '수학', '영어', '사회', '과학', '한국사', '정보'];

// Dummy data mirroring the image structure for '과학' (as a representative sample)
const CATEGORY_MAP: Record<string, { title: string; desc: string; subtitle: string }[]> = {
  '과학': [
    { title: '기초', subtitle: '통합과학1·2 / 과학탐구실험1·2', desc: '관찰·측정·비교·분류·변인 통제의 기본기를 만드는 단계입니다. 1학년 탐구는 거창한 전공명보다 "정확히 재고, 공정하게 비교하고, 그래프로 설명하는 능력"을 우선합니다.' },
    { title: '개념', subtitle: '물리학·화학·생명과학·지구과학', desc: '운동, 에너지, 반응, 물질대사, 유전, 지구시스템 등 핵심 개념을 실제 현상에 적용합니다. 2학년 탐구는 이론식·반응식·모형·자료 해석을 함께 사용하도록 설계합니다.' },
    { title: '심화', subtitle: '진로 선택 과목', desc: '역학과 에너지, 전자기와 양자, 물질과 에너지, 화학 반응의 세계, 세포와 물질대사, 생물의 유전, 지구시스템 과학, 행성우주과학을 전공 관심의 언어로 연결합니다.' },
    { title: '융합', subtitle: '기후 변화와 환경생태 / 융합과학 탐구', desc: '실생활 문제, 사회적 쟁점, 기술 적용 가능성을 다룹니다. 단, 주장형 보고서가 되지 않도록 수치 자료, 기준표, 다중 기준 평가를 반드시 포함합니다.' },
    { title: '연구', subtitle: '과학계열 심화·실험 과목', desc: '고급 물리학, 고급 화학, 고급 생명과학, 고급 지구과학, 과학과제연구, 물리학·화학·생명과학·지구과학 실험은 학교 개설 여건에 맞춰 연구형 심화로 확장합니다.' },
    { title: '도구', subtitle: '수학·정보와의 연결', desc: '공통수학, 대수, 미적분, 확률과 통계, 기하, 인공지능 수학, 정보는 탐구 결과를 설명하는 도구입니다. 회귀, 상관, 시뮬레이션, 알고리즘 비교가 세특의 깊이를 만듭니다.' }
  ]
};

const FLOW_STEPS = [
  { no: 1, title: '개념 선택', desc: '수업에서 이해가 흔들린 개념 또는 실험 장면을 고른다.' },
  { no: 2, title: '질문 변환', desc: '"왜?"를 "무엇을 바꾸면 어떤 값이 달라지는가?"로 바꾼다.' },
  { no: 3, title: '자료 설계', desc: '직접 측정, 공개 데이터, 모형 실험 중 하나를 선택한다.' },
  { no: 4, title: '분석 도구', desc: '그래프, 통계, 시뮬레이션, 모델 비교 중 하나를 적용한다.' },
  { no: 5, title: '기록 증거', desc: '오차·수정·후속 질문을 세특과 면접 언어로 정리한다.' }
];

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
  const initialKeywords = JSON.parse(sessionStorage.getItem('exploration_keywords') || '{}');
  
  const [activeSubject, setActiveSubject] = useState('과학');
  
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
학생부 추출 핵심 키워드: ${sKeys.join(', ')}
컨설턴트가 추가한 희망 진로/주제 키워드: ${uKeys.join(', ')}

위 키워드들을 완벽하게 융합하여, 입학사정관의 눈길을 사로잡을 수 있는 고품질의 [심화 탐구활동 주제]를 정확히 4개 생성해줘.

조건:
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

  const currentCards = CATEGORY_MAP[activeSubject] || CATEGORY_MAP['과학']; // Fallback to 과학 for demo

  return (
    <div className="explore-wrap fade-in">
      {/* 1. Header & Subject Tabs */}
      <div className="explore-header">
        <button className="back-btn-explore" onClick={onBack}><ArrowLeft size={20} /> 돌아가기</button>
        <div className="explore-title">
          <h1>교과 개념을 탐구 질문으로 바꾸는 연결 지도</h1>
          <p>이 영역의 목적은 과목명 안내가 아니라 “어느 수업 개념에서 출발해 어떤 방법으로 탐구할 것인가”를 결정하도록 돕는 것입니다. 과목은 탐구의 출발점이고, 변인·자료·모델은 탐구의 깊이를 보여주는 증거입니다.</p>
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

      {/* 2. Grid Cards (Embedded Screen Style) */}
      <div className="explore-grid">
        {currentCards.map((card, idx) => (
          <div key={idx} className="map-card">
            <span className="card-tag">{card.title}</span>
            <h3 className="card-subtitle">{card.subtitle}</h3>
            <p className="card-desc">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. Flow Diagram */}
      <div className="explore-flow">
        {FLOW_STEPS.map((step, idx) => (
          <React.Fragment key={step.no}>
            <div className="flow-step">
              <span className="step-no">{step.no}. {step.title}</span>
              <p className="step-desc">{step.desc}</p>
            </div>
            {idx < FLOW_STEPS.length - 1 && <ChevronRight className="flow-arrow" size={24} />}
          </React.Fragment>
        ))}
      </div>

      {/* 4. Input Section (Moved to Bottom) */}
      <section className="explore-input-section">
        <div className="input-header">
          <h2><Sparkles size={20} /> 탐구활동 제안 생성기</h2>
          <p>학생부 추출 키워드와 원장님이 기입한 키워드를 융합하여 4~5개의 완벽한 심화 탐구 주제를 뽑아냅니다.</p>
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
                {result.map((s, i) => (
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
                          {(s.activitySteps || []).map((st, idx) => <li key={idx}>{st}</li>)}
                        </ol>
                      </div>

                      <div className="rcard-output">
                        <strong>최종 산출물:</strong> {s.output}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorationModule;
