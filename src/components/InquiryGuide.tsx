import React, { useState } from 'react';
import { BookOpen, FlaskConical, Scale } from 'lucide-react';
import './InquiryGuide.css';

const InquiryGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'science' | 'social'>('science');

  return (
    <div className="inquiry-guide-container animate-fade-in">
      <div className="guide-header glass-panel">
        <div className="title-section">
          <div className="icon-wrapper">
            <BookOpen size={24} className="text-primary" />
          </div>
          <div className="title-text">
            <h2>교과 연계 심화 탐구활동 가이드</h2>
            <p>수업 개념에서 출발하여 측정 가능한 연구 문제로 발전시키는 탐구 설계 플랫폼</p>
          </div>
        </div>
        
        <div className="guide-tabs">
          <button 
            className={`tab-btn ${activeTab === 'science' ? 'active' : ''}`}
            onClick={() => setActiveTab('science')}
          >
            <FlaskConical size={18} />
            과학 교과 탐구 가이드
          </button>
          <button 
            className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            <Scale size={18} />
            사회 교과 탐구 가이드
          </button>
        </div>
      </div>

      <div className="guide-content glass-panel">
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
    </div>
  );
};

export default InquiryGuide;
