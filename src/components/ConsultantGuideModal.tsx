import React, { useState } from 'react';
import { BookOpen, Download, Printer, X, FileText, CheckCircle2, ChevronRight, Sparkles, FlaskConical, Scale, Layers } from 'lucide-react';
import { CURATED_MATCHING_TEMPLATES, INQUIRY_METHODOLOGY_GUIDES } from '../lib/inquiryMatchingTemplates';

interface ConsultantGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultantGuideModal: React.FC<ConsultantGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<number>(1);

  if (!isOpen) return null;

  const sections = [
    { id: 1, title: '1. 가이드 개요 및 탐구 철학', icon: <BookOpen size={16} /> },
    { id: 2, title: '2. 과학 교과 AI 정교화 프로세스', icon: <FlaskConical size={16} /> },
    { id: 3, title: '3. 사회 교과 AI 정교화 프로세스', icon: <Scale size={16} /> },
    { id: 4, title: '4. AI 데이터 분석·프롬프트 실무', icon: <Sparkles size={16} /> },
    { id: 5, title: '5. 필수 독서 연계 및 도서 DB 활용', icon: <Layers size={16} /> },
    { id: 6, title: '6. 합격 3단계 세특 기재 문장 공식', icon: <FileText size={16} /> },
    { id: 7, title: '7. 컨설턴트 앱 3대 매칭 루트 실무', icon: <CheckCircle2 size={16} /> },
    { id: 8, title: '8. 플래너 연동 및 A4 추천서 인쇄', icon: <Printer size={16} /> },
    { id: 9, title: '9. 전사 공식 풋터 및 고객 지원', icon: <BookOpen size={16} /> }
  ];

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1300, display: 'grid', placeItems: 'center', padding: '20px' }}>
      <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '1080px', height: '90vh', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Modal Top Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.95)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#8b1a1a', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>대치 수프리마 공식 실무 가이드</span>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>문서번호: SUPRIMA-MANUAL-2026-03 (2026. 11. 14 개정 2판)</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#f59e0b" />
              사회·과학 AI 심화탐구 및 학생 매칭 컨설턴트 실무 가이드북
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href="/guides/사회과학_AI_심화탐구_컨설턴트_활용가이드.docx"
              download="사회과학_AI_심화탐구_컨설턴트_활용가이드.docx"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.8rem', textDecoration: 'none', background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', border: 'none' }}
              title="Word(DOCX) 파일로 다운로드"
            >
              <Download size={14} /> Word(DOCX) 다운로드
            </a>
            <a
              href="/guides/사회과학_AI_심화탐구_컨설턴트_활용가이드.xlsx"
              download="사회과학_AI_심화탐구_컨설턴트_활용가이드.xlsx"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.8rem', textDecoration: 'none', borderColor: '#10b981', color: '#10b981' }}
              title="Excel(XLSX) 서식 파일로 다운로드"
            >
              <Download size={14} /> Excel(XLSX) 다운로드
            </a>
            <a
              href="/guides/사회과학_AI_심화탐구_컨설턴트_활용가이드.md"
              download="사회과학_AI_심화탐구_컨설턴트_활용가이드.md"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
              title="마크다운(MD) 파일로 다운로드"
            >
              <FileText size={14} /> MD 다운로드
            </a>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.8rem' }}
              title="인쇄 또는 PDF 저장"
            >
              <Printer size={14} /> 인쇄 / PDF 저장
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Modal Split View */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', overflow: 'hidden' }}>
          {/* Left Navigation */}
          <nav style={{ background: 'rgba(0,0,0,0.25)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', padding: '0 8px 8px', letterSpacing: '0.05em' }}>
              가이드북 목차
            </span>
            {sections.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: activeSection === s.id ? '1px solid #38bdf8' : '1px solid transparent',
                  background: activeSection === s.id ? 'rgba(56,189,248,0.15)' : 'transparent',
                  color: activeSection === s.id ? '#fff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: activeSection === s.id ? 700 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {s.icon}
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                {activeSection === s.id && <ChevronRight size={14} color="#38bdf8" />}
              </button>
            ))}
          </nav>

          {/* Right Content */}
          <main style={{ padding: '28px', overflowY: 'auto', background: '#0b1120', color: '#e2e8f0', lineHeight: 1.65 }}>
            {activeSection === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 1</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>가이드 개요 및 대치 수프리마 탐구 철학</h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1' }}>
                  대입 학생부종합전형에서 단순한 활동 나열이나 도서 목록 기재는 서류 평가에서 유의미한 변별력을 갖지 못합니다. 교육과정 개정 및 대입 공정성 강화 방안에 따라, 대학 평가관은 <strong>“교과 수업 내에서 발생한 호기심이 어떻게 학술적 독서로 이어지고, 가설 설정 및 실증적 검증 과정을 거쳐 학생부 세특에 기록되었는가”</strong>를 입체적으로 평가합니다.
                </p>

                <div style={{ background: 'rgba(139,26,26,0.15)', border: '1px solid rgba(139,26,26,0.3)', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#f87171' }}>대치 수프리마 3대 핵심 원칙</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>독서 필수 연계 (Reading-First Architecture)</strong>: 모든 심화 탐구는 학문적 깊이를 보증하는 필독서의 핵심 개념과 반드시 연결되어야 합니다.</li>
                    <li><strong>정량적 실증주의 (Empirical Verification)</strong>: 주관적 감상을 배제하고 과학(변인통제 실험), 사회(KOSIS 통계 분석), AI(알고리즘 정량 지표)를 반드시 도출합니다.</li>
                    <li><strong>완성형 3단계 세특 문장화</strong>: 학생부 교과 세특에 즉시 인용될 수 있는 정제된 3단계 문장(동기-탐구/실증-성장 역량)으로 산출합니다.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 2</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>과학 교과 AI 심화탐구 정교화 프로세스</h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1' }}>
                  과학 교과 탐구는 단순 보고서 작성을 지양하고, [가설 - 변인통제 - 정량실험 - 독서연계] 4단계를 구현합니다.
                </p>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {INQUIRY_METHODOLOGY_GUIDES.science.steps.map(step => (
                    <div key={step.stepNum} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ background: '#059669', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>STEP {step.stepNum}</span>
                        <strong style={{ color: '#fff' }}>{step.name}</strong>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>{step.description}</p>
                      <div style={{ fontSize: '0.8rem', color: '#34d399', background: 'rgba(16,185,129,0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                        🔍 체크포인트: {step.checkPoint}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#34d399' }}>대치동 시그니처 과학 탐구 예시</h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    주제: 미세플라스틱 생체 축적 메커니즘과 친환경 바이오필터 소재의 흡착 효율 비교 실험
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    📖 연계 도서: 『침묵의 봄』 (레이첼 카슨 / 에코리브르)
                  </p>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                    [과학탐구실험] 생태계 내 미세플라스틱 농축 문제에 문제의식을 갖고 도서 '침묵의 봄'을 정독하며 환경 생태학적 탐구를 심화함. 친환경 키토산 및 활성탄 기반 바이오필터의 미세플라스틱 흡착률을 온도와 pH 조건별로 통제 변인을 설정하여 정량 비교함. 실험 결과 키토산 복합 필터가 최대 94.2%의 흡착 효율을 보임을 데이터로 도출하고 지속 가능한 환경 소재 연구 역량을 탁월하게 드러냄.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 3</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>사회 교과 AI 심화탐구 정교화 프로세스</h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1' }}>
                  사회 교과 탐구는 주관적 주장을 배제하고 [쟁점발견 - 사상이론독서 - 통계실증 - 정책제안] 4단계를 구현합니다.
                </p>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {INQUIRY_METHODOLOGY_GUIDES.social.steps.map(step => (
                    <div key={step.stepNum} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ background: '#d97706', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>STEP {step.stepNum}</span>
                        <strong style={{ color: '#fff' }}>{step.name}</strong>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>{step.description}</p>
                      <div style={{ fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                        🔍 체크포인트: {step.checkPoint}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#fbbf24' }}>대치동 시그니처 사회 탐구 예시</h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    주제: 플랫폼 노동자의 법적 지위와 사회보험 사각지대 해소를 위한 공공 정책 설계
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    📖 연계 도서: 『플랫폼 자본주의』 (닉 서르닉 / 경성대학교출판부)
                  </p>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                    [정치와 법·경제 융합] 플랫폼 경제 확산에 따른 고용 구조의 구조적 변화를 탐색하고자 도서 '플랫폼 자본주의'를 정독함. 근로기준법상 전통적 근로자 개념과 특수형태근로종사자의 괴리를 법률 조항별로 분석하고, 고용보험 적용 데이터와 유럽연합(EU)의 플랫폼 노동 지침을 비교 검토함. 알고리즘 통제 수준에 따른 단계별 노동자성 인정 기준과 사회보험료 차등 분담 모델을 담은 모의 입법안을 완성도 높게 작성함.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <span style={{ color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 4</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>AI 데이터 분석·프롬프트 엔지니어링 활용 실무</h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1' }}>
                  인공지능 도구(AI)를 단순 질의응답이 아닌 [데이터정의 - 프롬프트파이프라인 - 알고리즘검증 - 윤리독서]의 연구 도구로 승화시키는 실무입니다.
                </p>

                <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#c084fc' }}>성공적인 프롬프트 엔지니어링 4대 요소</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>역할 (Role)</strong>: 모델의 페르소나 규정 (예: 대입 학생부 평가관, 생체재료공학 연구원)</li>
                    <li><strong>맥락 (Context)</strong>: 고교 교육과정 및 학생의 선행 지식, 연구 배경 제공</li>
                    <li><strong>지침 (Instruction)</strong>: 가설 설정 조건 및 변인 통제 요구사항을 번호로 구체화</li>
                    <li><strong>출력 형식 (Output Format)</strong>: 동기-탐구-성장 3단계 형식 지정 및 글자수 제약</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 5</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>필수 독서 연계 매칭 및 카카오·제미나이 AI 활용법</h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1' }}>
                  단순 상업성 링크(알라딘 등)를 완전히 배제하고, 공식 카카오 책 검색 API와 Google Gemini AI 3단계 브리핑 엔진을 결합하여 학술적 깊이를 부여합니다.
                </p>

                <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#38bdf8' }}>Google Gemini AI 3단계 도서 브리핑</h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>핵심 요약 3문장</strong>: 도서가 다루는 본질적 학문적 질문과 핵심 가치 요약</li>
                    <li><strong>심화 탐구 가설 2가지</strong>: 고교 교과와 연계 가능한 구체적 연구 문제 도출</li>
                    <li><strong>완성형 세특 문장</strong>: 학생부종합전형에 즉시 반영 가능한 학생 관점의 세특 문장 완성</li>
                  </ol>
                </div>
              </div>
            )}

            {activeSection === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 6</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>학생부 3단계 세특 기재 문장 완성 공식</h3>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                    합격 세특 문장 = [동기 및 도서 탐독] + [주도적 실증·실험 탐구] + [학업적 성장 및 전공 역량]
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                      <th style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>단계</th>
                      <th style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>핵심 요소</th>
                      <th style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>권장 서술 예시</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, color: '#38bdf8' }}>1단계: 동기</td>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>수업 중 의문 및 도서 탐독</td>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>`~수업 중 ~에 대한 문제의식을 갖고 도서 'OOO'을 정독하며 탐구를 기획함.`</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, color: '#34d399' }}>2단계: 탐구</td>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>변인통제 실험, 정량 데이터</td>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>`독립변인 ~을 통제한 비교 실험을 통해 ~% 수치를 도출하고 통계를 시각화함.`</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, color: '#f59e0b' }}>3단계: 성장</td>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>오차 요인 고찰, 전공 역량</td>
                      <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>`이론에 그치지 않고 오차 원인을 분석하여 개선안을 제안하는 역량을 드러냄.`</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 7 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 7</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>컨설턴트 앱 내 3대 매칭 루트 및 실무 프로세스</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.96rem', color: '#38bdf8' }}>루트 1: StudentDetail [4. 추천 & AI 매칭] 탭</h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1' }}>
                      학생 선택 후 상단 4번째 탭에서 [과학 AI], [사회 AI], [AI 데이터분석] 버튼을 클릭하여 엄선 템플릿을 선택하거나 직접 입력하여 즉시 매칭합니다.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.96rem', color: '#34d399' }}>루트 2: InquiryGuide 상단 학생 매칭 독 (Dock)</h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1' }}>
                      심화탐구가이드 화면 상단에 표시되는 `[🎯 매칭 대상: 홍길동 학생]`을 확인하고 가이드를 보며 원클릭으로 해당 학생에게 탐구를 배정합니다.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.96rem', color: '#f59e0b' }}>루트 3: ExplorationModule 주제 추천 매칭 버튼</h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1' }}>
                      주제탐구활동 생성기에서 AI가 생성한 카드마다 배치된 `[홍길동 학생 추천 매칭]` 버튼을 눌러 즉시 학생 프로필로 전송합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 8 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 8</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>밀착 플래너 연동 및 A4 추천서 인쇄 안내</h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1' }}>
                  매칭된 탐구 과제는 밀착 플래너에 주차별 과제로 자동 동기화되며, 학부모 상담 시 A4 규격의 공식 맞춤 추천서로 인쇄할 수 있습니다.
                </p>

                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#fff' }}>인쇄 양식 구성 항목</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>학생 기본 정보: 학생명, 희망 진로, 컨설팅 서비스 과정 (1·3·6개월), 발행일자</li>
                    <li>과목별 추천 카드: 탐구 주제명, 필수 연계 도서명 및 핵심 요약</li>
                    <li>추천 세특 기재 문장 (생기부 기재용 3단계 완성형 문장)</li>
                    <li>컨설턴트 지도 조언 (변인 통제, 통계 수치, 코딩 조언)</li>
                    <li>대치수프리마 공식 직인 및 전사 표준 풋터</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 9 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>SECTION 9</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>전사 공식 풋터 및 고객 지원 채널</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 800, color: '#f8fafc', fontSize: '1rem' }}>대치수프리마 입시&코칭센터</p>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>대표 : 이기욱 대표컨설턴트 | 메일 : suprimalab@gmail.com | 연락처 : 010-2370-1077(문자전송)</p>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>소재지 : 서울시 강남구 테헤란로 326 B1F</p>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>네이버 밴드 : band.us/@suprima | 블로그 : blog.naver.com/gouniv_hifive | 인스타그램 : suprima_ipsicreator</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ConsultantGuideModal;
