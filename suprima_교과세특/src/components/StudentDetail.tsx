import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileSearch,
  FileText,
  History,
  MessageSquare,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pb } from '../lib/pocketbase';
import './StudentDetail.css';

interface StudentDetailProps {
  studentData: { id: string; name: string } | null;
  onBack: () => void;
}

type AnalysisGrade = {
  semester?: string;
  subject?: string;
  credit?: string | number;
  score?: string | number;
  note?: string;
};

type AnalysisActivity = {
  title?: string;
  detail?: string;
};

type AnalysisResult = {
  analysis_summary?: string;
  analysisSummary?: string;
  grades?: AnalysisGrade[];
  activities?: AnalysisActivity[];
  strengths?: string[];
  improvement_points?: string[];
  risk_points?: string[];
  consultant_memo?: string;
  memo?: string;
  [key: string]: unknown;
};

type AnalysisRecord = {
  id: string;
  created: string;
  content: AnalysisResult;
};

const STUDENT_RECORD_REFERENCE_URL = 'https://park-sanggeun.github.io/student-record-evaluation/';

const RISK_OPTIONS = [
  { id: 'core', label: '전공 핵심과목 부족', detail: '핵심과목의 연속성과 이수 폭을 확인합니다.' },
  { id: 'trend', label: '성취 추이 정체/하락', detail: '학기별 성적 흐름이 멈추거나 떨어지는지 봅니다.' },
  { id: 'continuity', label: '탐구 연속성 부족', detail: '세특과 창체가 단발성인지 확인합니다.' },
  { id: 'common', label: '공통문구 가능성', detail: '개별성이 드러나는 근거가 충분한지 확인합니다.' },
];

function normalizeAnalysis(content: AnalysisResult | null | undefined): AnalysisResult {
  const source = content ?? {};

  return {
    ...source,
    analysis_summary: source.analysis_summary ?? source.analysisSummary ?? '',
    grades: Array.isArray(source.grades) ? source.grades : [],
    activities: Array.isArray(source.activities) ? source.activities : [],
    strengths: Array.isArray(source.strengths) ? source.strengths : [],
    improvement_points: Array.isArray(source.improvement_points) ? source.improvement_points : [],
    risk_points: Array.isArray(source.risk_points) ? source.risk_points : [],
    consultant_memo: source.consultant_memo ?? source.memo ?? '',
  };
}

function formatGradeValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR');
}

const StudentDetail: React.FC<StudentDetailProps> = ({ studentData, onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<AnalysisRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');
  const [selectedRiskIds, setSelectedRiskIds] = useState<string[]>([]);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const normalizedResult = useMemo(() => normalizeAnalysis(analysisResult), [analysisResult]);

  const metrics = useMemo(() => {
    const grades = normalizedResult.grades ?? [];
    const activities = normalizedResult.activities ?? [];
    return [
      { label: '분석 기록', value: String(pastAnalyses.length) },
      { label: '과목 항목', value: String(grades.length) },
      { label: '활동 항목', value: String(activities.length) },
      {
        label: '최신 갱신',
        value: pastAnalyses[0]?.created ? formatDate(pastAnalyses[0].created) : '-',
      },
    ];
  }, [normalizedResult.activities, normalizedResult.grades, pastAnalyses]);

  useEffect(() => {
    if (studentData) {
      fetchPastAnalyses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentData?.id]);

  const applyRecordContent = (content: AnalysisResult | null | undefined) => {
    const next = normalizeAnalysis(content);
    setAnalysisResult(next);
    setSelectedRiskIds(next.risk_points ?? []);
  };

  const fetchPastAnalyses = async () => {
    if (!studentData) return;

    try {
      const records = (await pb.collection('pdf_analyses').getFullList({
        filter: `student_id = "${studentData.id}"`,
        sort: '-created',
      })) as AnalysisRecord[];
      setPastAnalyses(records);
      if (records.length > 0) {
        applyRecordContent(records[0].content);
      } else {
        setAnalysisResult(null);
        setSelectedRiskIds([]);
      }
    } catch (error) {
      console.error('Fetch past analyses error:', error);
    }
  };

  const handleStartScan = async () => {
    if (!inputText.trim()) {
      alert('학생부 텍스트를 입력하거나 PDF 내용을 붙여넣어 주세요.');
      return;
    }

    setIsScanning(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
학생 이름: "${studentData?.name ?? '미지정'}"
입력 텍스트:
"""
${inputText}
"""

위 텍스트를 학생부종합전형 평가 화면에 맞게 구조화해서 아래 JSON 형식으로만 응답해 주세요.
{
  "analysis_summary": "3~5문장 요약",
  "grades": [
    { "semester": "1-1", "subject": "과목명", "credit": "1", "score": "A", "note": "사정관 관점 메모" }
  ],
  "activities": [
    { "title": "활동명", "detail": "핵심 근거와 해석" }
  ],
  "strengths": ["강점 1", "강점 2"],
  "improvement_points": ["보완점 1", "보완점 2"],
  "risk_points": ["전공 핵심과목 부족"]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(jsonStr);

      applyRecordContent(data);
      setActiveTab('analysis');
      alert('학생부 분석이 완료되었습니다.');
    } catch (error) {
      console.error('AI 분석 오류:', error);
      alert('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveResult = async () => {
    if (!studentData || !analysisResult) return;

    setIsSaving(true);
    try {
      const payload = {
        ...normalizedResult,
        consultant_memo: normalizedResult.consultant_memo ?? '',
        risk_points: selectedRiskIds,
        updated_at: new Date().toISOString(),
      };

      await pb.collection('pdf_analyses').create({
        student_id: studentData.id,
        content: payload,
      });
      alert('저장되었습니다.');
      await fetchPastAnalyses();
      setActiveTab('history');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert('저장 실패: ' + message);
    } finally {
      setIsSaving(false);
    }
  };

  const summaryText = normalizedResult.analysis_summary?.trim() || '학생부 텍스트를 입력한 뒤 AI 분석을 실행하면 요약이 표시됩니다.';
  const grades = normalizedResult.grades ?? [];
  const activities = normalizedResult.activities ?? [];
  const strengths = normalizedResult.strengths ?? [];
  const improvementPoints = normalizedResult.improvement_points ?? [];
  const consultantMemo = normalizedResult.consultant_memo ?? '';

  const historyView = (
    <div className="history-panel">
      <div className="panel-heading">
        <div>
          <h3>분석 기록</h3>
          <p>이전 학생부 분석 결과를 눌러 바로 다시 불러옵니다.</p>
        </div>
        <span className="panel-pill">{pastAnalyses.length}건</span>
      </div>

      <div className="history-list">
        {pastAnalyses.length === 0 ? (
          <div className="empty-state">저장된 분석 결과가 없습니다.</div>
        ) : (
          pastAnalyses.map((item) => {
            const content = normalizeAnalysis(item.content);
            const preview =
              content.analysis_summary?.slice(0, 80) ||
              content.grades?.[0]?.note?.slice(0, 80) ||
              '분석 미리보기 없음';

            return (
              <button
                key={item.id}
                className="history-item"
                onClick={() => {
                  applyRecordContent(item.content);
                  setActiveTab('analysis');
                }}
              >
                <div className="history-main">
                  <strong>{formatDate(item.created)}</strong>
                  <p>{preview}</p>
                </div>
                <ChevronRight size={16} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  if (!studentData) {
    return (
      <div className="student-detail fade-in">
        <div className="empty-state">학생을 선택해 주세요.</div>
      </div>
    );
  }

  return (
    <div className="student-detail fade-in">
      <header className="detail-header glass-panel">
        <div className="header-left">
          <button className="back-btn" onClick={onBack} aria-label="뒤로가기">
            <ArrowLeft size={20} />
          </button>
          <div className="student-profile">
            <div className="avatar">{studentData.name?.[0] ?? 'S'}</div>
            <div className="info">
              <h3>{studentData.name}</h3>
              <span>학생부 분석결과 · 사정관형 평가 화면</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <a className="reference-link" href={STUDENT_RECORD_REFERENCE_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            <span>참고 화면 열기</span>
          </a>
          <div className="header-tabs">
            <button className={activeTab === 'analysis' ? 'active' : ''} onClick={() => setActiveTab('analysis')}>
              <Sparkles size={16} />
              <span>분석결과</span>
            </button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
              <History size={16} />
              <span>히스토리 ({pastAnalyses.length})</span>
            </button>
          </div>
        </div>
      </header>

      <div className="evaluation-layout">
        <aside className="scan-section glass-panel">
          <div className="panel-heading">
            <div>
              <h3>학생부 원문 입력</h3>
              <p>텍스트를 붙여넣거나 PDF 추출 내용을 입력하면 구조화 분석을 진행합니다.</p>
            </div>
            <ClipboardList size={18} />
          </div>

          <textarea
            className="analysis-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="세특, 교과학습발달상황, 창의적 체험활동, 행동특성 및 종합의견을 붙여넣어 주세요."
          />

          <div className="action-row">
            <button className="btn-primary" onClick={handleStartScan} disabled={isScanning}>
              {isScanning ? <RefreshCw className="spin" size={18} /> : <FileSearch size={18} />}
              <span>{isScanning ? '분석 중...' : 'AI 분석 시작'}</span>
            </button>
            <button className="btn-secondary" onClick={handleSaveResult} disabled={!analysisResult || isSaving}>
              <Save size={18} />
              <span>{isSaving ? '저장 중...' : '결과 저장'}</span>
            </button>
          </div>

          <div className="quick-note">
            <ShieldAlert size={16} />
            <span>외부 예시처럼 좌측은 원문과 입력, 가운데는 요약/비교, 우측은 평가 메모로 나눴습니다.</span>
          </div>
        </aside>

        <main className="analysis-section glass-panel">
          {activeTab === 'history' ? (
            historyView
          ) : (
            <div className="analysis-scroll">
              <div className="summary-grid">
                {metrics.map((metric) => (
                  <div key={metric.label} className="metric-card">
                    <span className="metric-label">{metric.label}</span>
                    <strong className="metric-value">{metric.value}</strong>
                  </div>
                ))}
              </div>

              <section className="report-card">
                <div className="card-title-row">
                  <h4>
                    <BarChart3 size={18} />
                    <span>입학사정관 요약</span>
                  </h4>
                  <span className="panel-pill">핵심</span>
                </div>
                <p className="report-copy">{summaryText}</p>
              </section>

              <section className="report-card">
                <div className="card-title-row">
                  <h4>
                    <FileText size={18} />
                    <span>교과 분석</span>
                  </h4>
                  <span className="panel-pill">{grades.length}개</span>
                </div>

                {grades.length === 0 ? (
                  <div className="empty-inline">과목 분석 데이터가 없습니다.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="grade-table">
                      <thead>
                        <tr>
                          <th>학기</th>
                          <th>과목</th>
                          <th>학점</th>
                          <th>성취</th>
                          <th>메모</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((grade, index) => (
                          <tr key={`${grade.subject ?? 'grade'}-${index}`}>
                            <td>{formatGradeValue(grade.semester)}</td>
                            <td>{formatGradeValue(grade.subject)}</td>
                            <td>{formatGradeValue(grade.credit)}</td>
                            <td>
                              <span className="score-pill">{formatGradeValue(grade.score)}</span>
                            </td>
                            <td>{formatGradeValue(grade.note)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="report-card">
                <div className="card-title-row">
                  <h4>
                    <MessageSquare size={18} />
                    <span>활동 해석</span>
                  </h4>
                  <span className="panel-pill">{activities.length}개</span>
                </div>

                {activities.length === 0 ? (
                  <div className="empty-inline">활동 분석 데이터가 없습니다.</div>
                ) : (
                  <div className="activity-list">
                    {activities.map((activity, index) => (
                      <article key={`${activity.title ?? 'activity'}-${index}`} className="activity-item">
                        <strong>{activity.title || `활동 ${index + 1}`}</strong>
                        <p>{activity.detail || '상세 설명 없음'}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <div className="mini-grid">
                <section className="report-card">
                  <div className="card-title-row">
                    <h4>강점</h4>
                    <span className="panel-pill">{strengths.length}개</span>
                  </div>
                  {strengths.length === 0 ? (
                    <div className="empty-inline">강점 항목이 없습니다.</div>
                  ) : (
                    <ul className="bullet-list">
                      {strengths.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="report-card">
                  <div className="card-title-row">
                    <h4>보완점</h4>
                    <span className="panel-pill">{improvementPoints.length}개</span>
                  </div>
                  {improvementPoints.length === 0 ? (
                    <div className="empty-inline">보완점 항목이 없습니다.</div>
                  ) : (
                    <ul className="bullet-list">
                      {improvementPoints.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>

        <aside className="memo-section glass-panel">
          <div className="panel-heading">
            <div>
              <h3>입학사정관 평가</h3>
              <p>위험 요소와 메모를 남기면 결과 저장 시 함께 보관됩니다.</p>
            </div>
            <ShieldAlert size={18} />
          </div>

          <div className="risk-list">
            {RISK_OPTIONS.map((option) => {
              const checked = selectedRiskIds.includes(option.id);
              return (
                <label key={option.id} className={`risk-item ${checked ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedRiskIds((current) =>
                        current.includes(option.id)
                          ? current.filter((item) => item !== option.id)
                          : [...current, option.id],
                      )
                    }
                  />
                  <div>
                    <strong>{option.label}</strong>
                    <span>{option.detail}</span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="memo-box">
            <div className="memo-label">평가 메모</div>
            <textarea
              value={consultantMemo}
              onChange={(e) =>
                setAnalysisResult((current) => ({
                  ...normalizeAnalysis(current),
                  consultant_memo: e.target.value,
                }))
              }
              placeholder="입학사정관 메모를 입력하세요."
            />
          </div>

          <div className="memo-footer">
            <button className="btn-primary full-width" onClick={handleSaveResult} disabled={!analysisResult || isSaving}>
              <Save size={18} />
              <span>{isSaving ? '저장 중...' : '평가 저장'}</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StudentDetail;
