import React, { useState } from 'react';
import { UploadCloud, FileText, ChevronLeft, BarChart2, BookOpen, AlertCircle, User, Award, Activity, Calendar } from 'lucide-react';
import './StudentDetail.css';

interface StudentDetailProps {
  onBack: () => void;
  onCoaching?: () => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ onBack, onCoaching }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'analysis'>('info');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('done');

  const handleUpload = () => {
    setUploadState('uploading');
    setTimeout(() => {
      setUploadState('analyzing');
      setTimeout(() => setUploadState('done'), 2000);
    }, 1500);
  };

  return (
    <div className="student-detail-view">
      <div className="detail-header glass-panel">
        <button className="icon-btn secondary" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div className="student-meta">
          <h2>김지민 학생</h2>
          <span className="tag-goal">목표: 컴퓨터공학과</span>
        </div>
        <div className="detail-tabs">
          <button 
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            종합 정보
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            생기부 원본 분석
          </button>
        </div>
      </div>

      <div className="detail-content">
        {activeTab === 'info' && (
          <div className="full-info-dashboard">
            <div className="info-grid top-row">
              <div className="glass-panel profile-card">
                <div className="profile-header">
                  <div className="avatar-large">김</div>
                  <div>
                    <h3>김지민</h3>
                    <p>서울과학고 2학년 3반 12번</p>
                  </div>
                </div>
                <div className="profile-details">
                  <div className="detail-row">
                    <span className="label">희망 전공</span>
                    <span className="value">소프트웨어공학, 컴퓨터과학</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">연락처</span>
                    <span className="value">010-1234-5678</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">학부모 연락처</span>
                    <span className="value">010-8765-4321 (모)</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel stats-card">
                <h3 className="section-title"><Award size={18} /> 내신 및 모의고사 추이</h3>
                <div className="grades-summary">
                  <div className="grade-box">
                    <span className="grade-label">전과목 내신</span>
                    <span className="grade-val">1.4 <small>등급</small></span>
                  </div>
                  <div className="grade-box">
                    <span className="grade-label">국영수과</span>
                    <span className="grade-val">1.2 <small>등급</small></span>
                  </div>
                  <div className="grade-box">
                    <span className="grade-label">최근 모의고사</span>
                    <span className="grade-val">백분위 98%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-grid bottom-row">
              <div className="glass-panel activity-card">
                <h3 className="section-title"><Activity size={18} /> 자동봉진 (비교과 활동)</h3>
                <ul className="timeline-list">
                  <li>
                    <span className="time-badge">자율</span>
                    <p>학급 반장으로서 면학 분위기 조성 (1학기)</p>
                  </li>
                  <li>
                    <span className="time-badge">동아리</span>
                    <p>알고리즘 연구 동아리 'Algo' 기장 - BFS/DFS 탐구</p>
                  </li>
                  <li>
                    <span className="time-badge">진로</span>
                    <p>IT 기업 탐방 및 AI 개발자 멘토링 특강 수강</p>
                  </li>
                  <li>
                    <span className="time-badge">봉사</span>
                    <p>지역 복지관 어르신 스마트폰 교육 봉사 (24시간)</p>
                  </li>
                </ul>
              </div>

              <div className="glass-panel consult-card">
                <h3 className="section-title"><Calendar size={18} /> 컨설팅 / 상담 일지</h3>
                <div className="consult-logs">
                  <div className="log-item">
                    <div className="log-date">2026.04.10</div>
                    <div className="log-content">
                      <strong>1학기 중간고사 대비 상담</strong>
                      <p>수학 미적분 파트 오답률 체크 완료. 수행평가 비중이 높은 과학교과 세특 전략 수립 (물리학 역학 파트 연계).</p>
                    </div>
                  </div>
                  <div className="log-item">
                    <div className="log-date">2026.03.15</div>
                    <div className="log-content">
                      <strong>연간 학업 계획 수립</strong>
                      <p>1지망 대학(S대 컴공) 합격을 위한 로드맵 설정. 수학/과학 내신 1.1등급 유지 목표.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          uploadState !== 'done' ? (
            <div className="upload-section glass-panel">
              <div className="upload-box" onClick={handleUpload}>
                {uploadState === 'idle' && (
                  <>
                    <UploadCloud size={64} className="upload-icon" />
                    <h3>나이스/정부24 생기부 PDF 업로드</h3>
                    <p>클릭하여 파일을 선택하거나 이곳으로 드래그 앤 드롭 하세요 (학생이 직접 전달한 PDF)</p>
                    <button className="btn-primary" style={{ marginTop: '20px' }}>파일 선택</button>
                  </>
                )}
                {uploadState === 'uploading' && (
                  <div className="processing">
                    <div className="spinner"></div>
                    <h3>PDF 업로드 중...</h3>
                    <p>안전한 환경으로 전송 중입니다.</p>
                  </div>
                )}
                {uploadState === 'analyzing' && (
                  <div className="processing">
                    <FileText size={48} className="upload-icon animate-pulse" />
                    <h3>생기부 AI 해독 중...</h3>
                    <p>표와 텍스트를 분석하여 구조화하고 있습니다.</p>
                  </div>
                )}
              </div>
              
              <div className="info-alert">
                <AlertCircle size={20} />
                <p>현재 정부 망(나이스, 정부24)의 오픈 API 부재로 인해 자동 끌어오기는 지원하지 않습니다. 발급된 PDF를 다운로드 후 업로드해주세요.</p>
              </div>
            </div>
          ) : (
            <div className="analysis-results">
              <div className="results-grid">
                <div className="glass-panel main-analysis">
                  <div className="section-header">
                    <h3><BarChart2 size={20} /> 교과세특 AI 분석 보고서</h3>
                  </div>
                  <div className="radar-placeholder">
                    [학생 역량 방사형 차트 영역]
                  </div>
                  
                  <div className="subject-box">
                    <div className="subject-head">
                      <h4>통합과학</h4>
                      <span className="grade">1등급</span>
                    </div>
                    <p className="setek-text">
                      "물리학 실험에서 데이터 분석에 뛰어난 역량을 보이며, 오차 발생 원인을 파악하는 끈기가 돋보임..."
                    </p>
                    <div className="ai-insight">
                      <strong>AI 피드백:</strong> 공학 계열 진학을 위해 '소프트웨어를 활용한 데이터 시각화' 활동이 추가되면 좋습니다.
                    </div>
                  </div>
                  
                  <div className="subject-box">
                    <div className="subject-head">
                      <h4>수학 II</h4>
                      <span className="grade">2등급</span>
                    </div>
                    <p className="setek-text">
                      "미적분의 개념을 이해하고 실생활 문제에 적용하려 노력함..."
                    </p>
                    <div className="ai-insight">
                      <strong>AI 피드백:</strong> '컴퓨터 알고리즘과 수학적 최적화'를 엮은 심화 탐구 보고서가 필요합니다.
                    </div>
                  </div>
                </div>

                <div className="glass-panel side-panel">
                  <div className="section-header">
                    <h3><BookOpen size={20} /> 추천 도서 및 활동</h3>
                  </div>
                  <div className="recommendation-list">
                    <div className="rec-card">
                      <h5>엔지니어는 어떻게 일하는가</h5>
                      <p>연계 과목: 통합과학, 물리학</p>
                      <button className="btn-secondary small" onClick={onCoaching}>활동 제안서 생성 / 코칭</button>
                    </div>
                    <div className="rec-card">
                      <h5>수학의 확실성</h5>
                      <p>연계 과목: 수학 II</p>
                      <button className="btn-secondary small" onClick={onCoaching}>활동 제안서 생성 / 코칭</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default StudentDetail;
