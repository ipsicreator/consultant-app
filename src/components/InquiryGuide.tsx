import React, { useState } from 'react';
import { BookOpen, FlaskConical, Scale, Sparkles, Send, Lightbulb, Check, ExternalLink, X } from 'lucide-react';
import {
  type ConsultantRecommendation,
  CURATED_MATCHING_TEMPLATES,
  INQUIRY_METHODOLOGY_GUIDES
} from '../lib/inquiryMatchingTemplates';
import ConsultantGuideModal from './ConsultantGuideModal';
import './InquiryGuide.css';

interface InquiryGuideProps {
  studentData?: { id: string; name: string } | null;
  onNavigate?: (view: string) => void;
}

const InquiryGuide: React.FC<InquiryGuideProps> = ({ studentData, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'science' | 'social' | 'ai'>('science');
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConsultantRecommendation | null>(null);
  const [isGuideBookModalOpen, setIsGuideBookModalOpen] = useState(false);

  const currentGuide = INQUIRY_METHODOLOGY_GUIDES[activeTab];
  const templatesForCategory = CURATED_MATCHING_TEMPLATES.filter(t => t.category === activeTab);

  const handleMatchToStudent = (tmpl: ConsultantRecommendation) => {
    if (!studentData?.id) {
      alert('먼저 상단이나 대시보드에서 매칭할 학생을 선택해 주세요.');
      return;
    }

    window.dispatchEvent(new CustomEvent('ADD_RECOMMENDATION', {
      detail: {
        category: tmpl.category,
        subject: tmpl.subject,
        topicTitle: tmpl.topicTitle,
        bookTitle: tmpl.bookTitle,
        bookAuthor: tmpl.bookAuthor || '',
        bookPublisher: tmpl.bookPublisher || '',
        coreConcept: tmpl.coreConcept,
        setukDraft: tmpl.setukDraft,
        consultantTip: tmpl.consultantTip || ''
      }
    }));

    setIsMatchModalOpen(false);
  };

  return (
    <div className="inquiry-guide-container animate-fade-in">
      <div className="guide-header glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div className="title-section">
            <div className="icon-wrapper">
              <BookOpen size={24} className="text-primary" />
            </div>
            <div className="title-text">
              <h2>교과 연계 심화 탐구활동 가이드 & 학생 매칭</h2>
              <p>수업 개념에서 출발하여 측정 가능한 연구 문제로 발전시키는 과학·사회·AI 정교화 탐구 설계 플랫폼</p>
            </div>
          </div>

          {/* Student Matching Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsGuideBookModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem', borderColor: '#f59e0b', color: '#f59e0b' }}
            >
              <BookOpen size={14} /> 📄 사회·과학 AI 활용 가이드북 확인 & 다운로드
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>🎯 매칭 대상:</span>
            {studentData ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: '#38bdf8', fontSize: '0.92rem' }}>{studentData.name} 학생</strong>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsMatchModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  <Sparkles size={13} />
                  <span>이 가이드 매칭하기</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>선택된 학생 없음</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (onNavigate) onNavigate('dashboard');
                    else window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'dashboard' }));
                  }}
                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                >
                  대시보드에서 선택
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
        
        <div className="guide-tabs">
          <button 
            className={`tab-btn ${activeTab === 'science' ? 'active' : ''}`}
            onClick={() => setActiveTab('science')}
          >
            <FlaskConical size={18} />
            과학 교과 탐구 가이드 (가설·변인통제)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            <Scale size={18} />
            사회 교과 탐구 가이드 (쟁점·통계실증)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} 
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={18} />
            AI 데이터 분석·프롬프트 가이드
          </button>
        </div>
      </div>

      <div className="guide-content glass-panel" style={{ position: 'relative' }}>
        {activeTab === 'ai' && <iframe src="https://jinhak.esteacher.kr/ai_prompt.html" title="AI 데이터 분석·프롬프트 가이드" className="guide-iframe" referrerPolicy="no-referrer"/>}
        {activeTab === 'science' && (
          <iframe 
            src="https://jinhak.esteacher.kr/sciencetam.html" 
            title="과학 교과 탐구 가이드"
            className="guide-iframe"
          />
        )}
        {activeTab === 'social' && (
          <iframe 
            src="https://jinhak.esteacher.kr/socialtam.html" 
            title="사회 교과 탐구 가이드"
            className="guide-iframe"
          />
        )}
      </div>

<ConsultantGuideModal isOpen={isGuideBookModalOpen} onClose={() => setIsGuideBookModalOpen(false)} />

            {/* Matching Modal from Inquiry Guide */}
      {isMatchModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'grid', placeItems: 'center', zIndex: 1200, padding: '20px' }}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '85vh', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                  {activeTab === 'science' ? '🧪 과학 AI 탐구' : activeTab === 'social' ? '⚖️ 사회 AI 탐구' : '🤖 AI 데이터분석'}
                </span>
                <h3 style={{ margin: '2px 0 0 0', color: '#fff', fontSize: '1.15rem' }}>
                  {studentData?.name} 학생에게 {currentGuide?.title} 기반 탐구 매칭
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMatchModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#cbd5e1' }}>
                대치 수프리마 엄선 템플릿 중 하나를 선택하면 <strong>{studentData?.name}</strong> 학생의 <strong>[4. 탐구·독서·세특 추천]</strong> 목록으로 즉시 매칭 저장됩니다.
              </p>

              <div style={{ display: 'grid', gap: '10px' }}>
                {templatesForCategory.map(tmpl => (
                  <div key={tmpl.id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>{tmpl.subject}</span>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleMatchToStudent(tmpl)}
                        style={{ padding: '4px 12px', fontSize: '0.76rem' }}
                      >
                        이 탐구 매칭하기
                      </button>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.94rem', color: '#fff' }}>{tmpl.topicTitle}</h4>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <strong>📖 연계 도서:</strong> {tmpl.bookTitle} ({tmpl.bookAuthor})
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      {tmpl.setukDraft}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsMatchModalOpen(false);
                  if (onNavigate) onNavigate('student');
                  else window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'student' }));
                }}
                style={{ fontSize: '0.8rem' }}
              >
                학생 상세 [4. 추천 탭]으로 직접 이동
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsMatchModalOpen(false)}
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiryGuide;
