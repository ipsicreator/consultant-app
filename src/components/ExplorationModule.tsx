import StudentActivities from './StudentActivities';
import ActivityResources from './ActivityResources';
import React, { useMemo, useState } from 'react';
import { Lightbulb, BookOpen, Sparkles, Send, RefreshCw, X, ArrowLeft, Calendar, ExternalLink, Copy, Check } from 'lucide-react';
import { requestLabAI } from '../lib/lab';
import { requireStudentAccess } from '../lib/profileLink';
import { sessionIdentity } from '../lib/studentRecords';
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

const ExplorationModule: React.FC<ExplorationModuleProps> = ({ studentData, onBack }) => {
  const getInitialKeywords = () => {
    try {
      const stored = sessionStorage.getItem('exploration_keywords:' + sessionIdentity() + ':' + (studentData?.id || 'unassigned'));
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


  const generate = async () => {
    const sKeys = [studentKeyword1, studentKeyword2, studentKeyword3].filter(k => k.trim());
    const uKeys = [userKeyword1, userKeyword2, userKeyword3].filter(k => k.trim());
    
    if (sKeys.length === 0 && uKeys.length === 0) {
      alert('최소 1개 이상의 키워드를 입력해 주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      if (studentData?.id) await requireStudentAccess(studentData.id);
      const parsed = await requestLabAI('exploration-topics', { studentName: studentData?.name || '', subject: genSubject, grade: genGrade, studentKeywords: sKeys, userKeywords: uKeys });
      if (Array.isArray(parsed) && parsed.length > 0) {
        setResult(parsed);
      } else {
        throw new Error('탐구 제안 응답을 확인하지 못했습니다. 다시 시도해 주세요.');
      }
    } catch (e) {
      console.error(e);
      setResult(null);
      alert(e instanceof Error ? e.message : '탐구 제안을 완료하지 못했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentMapCards = DEFAULT_CATEGORY_MAP[activeSubject] || DEFAULT_CATEGORY_MAP['과학'];

  return (
    <div className="explore-wrap fade-in">
      <ActivityResources/>
      {studentData?.id && <StudentActivities key={studentData.id} studentId={studentData.id}/>}
      
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
                    {/* 1. 탐구활동 제안 */}
                    <div className="rcard-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="rcard-badge" style={{ background: '#8b1a1a', color: '#fff' }}>1. 탐구활동 제안</span>
                        <span className="rcard-badge">제안 {i + 1}</span>
                      </div>
                      <h3>{s.title}</h3>
                    </div>
                    <div className="rcard-body">
                      <p className="rcard-objective"><strong>목표:</strong> {s.objective}</p>

                      <div className="rcard-steps">
                        <strong>탐구 진행 단계</strong>
                        <ol>
                          {(s.activitySteps || []).map((st: string, idx: number) => <li key={idx}>{st}</li>)}
                        </ol>
                      </div>

                      {/* 2. 세특 문장 보여주기 */}
                      <div className="rcard-output" style={{ background: 'rgba(215, 194, 165, 0.15)', border: '1px solid rgba(215, 194, 165, 0.4)', borderRadius: '10px', padding: '12px', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={14} /> 2. 추천 세특 문장 / 산출물
                          </strong>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                            onClick={() => {
                              if (!s.output) return;
                              navigator.clipboard.writeText(s.output);
                              alert('세특 문장이 복사되었습니다.');
                            }}
                          >
                            복사
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>{s.output}</p>
                      </div>

                      {/* 3. 연계 추천 도서 · 탐구 요약 */}
                      <div className="rcard-reading" style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <strong style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BookOpen size={16} /> 3. 연계 추천 도서 · 탐구 요약
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>도서 DB</span>
                        </div>
                        <div className="reading-box" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px' }}>
                          <p className="b-title" style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#f8fafc' }}>📖 {s.reading?.bookTitle || '추천 도서 준비 중'}</p>
                          {s.reading?.reason && <p className="b-reason" style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>{s.reading?.reason}</p>}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', border: 'none', padding: '10px 12px', fontSize: '0.82rem', fontWeight: 700 }}
                          onClick={() => {
                            if (!studentData?.id) {
                              alert('대시보드에서 매칭할 학생을 먼저 선택해 주세요.');
                              return;
                            }
                            const category = genSubject.includes('과학') ? 'science' : genSubject.includes('사회') ? 'social' : genSubject.includes('정보') ? 'ai' : 'general';
                            window.dispatchEvent(new CustomEvent('ADD_RECOMMENDATION', {
                              detail: {
                                category,
                                subject: genSubject,
                                topicTitle: s.title,
                                bookTitle: s.reading?.bookTitle || '추천 연계 도서',
                                bookAuthor: '',
                                bookPublisher: '',
                                coreConcept: s.objective || s.reading?.reason || '',
                                setukDraft: s.output || '',
                                consultantTip: `탐구 진행 단계: ${(s.activitySteps || []).join(' → ')}`
                              }
                            }));
                          }}
                        >
                          <Sparkles size={15} />
                          {studentData?.name ? `${studentData.name} 학생 추천 매칭` : '학생 추천 매칭'}
                        </button>
                        <button 
                          type="button"
                          className="btn-secondary" 
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 12px', fontSize: '0.82rem' }}
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('TRANSFER_TO_PLANNER', { detail: { title: s.title } }));
                            window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'planner' }));
                          }}
                        >
                          <Calendar size={15} />
                          플래너 전송
                        </button>
                      </div>
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
