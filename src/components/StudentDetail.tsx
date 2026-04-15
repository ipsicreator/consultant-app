import React, { useState } from 'react';
import { 
  ChevronLeft, 
  FileText,
  Award,
  UploadCloud,
  BarChart2,
  Activity
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell
} from 'recharts';
import './StudentDetail.css';
import { analyzeStudentReportPDF } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { prepareChartData, prepareTrendData, prepareDetailedStats } from '../lib/gradeCalculator';

interface StudentDetailProps {
  studentData?: { id: string, name: string } | null;
  onBack: () => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ studentData, onBack }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'analysis'>('analysis'); // 기본 탭을 '생기부 분석'으로 변경 (빠른 스캔 대비)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isQuickScan = !studentData; // 학생 데이터가 없으면 빠른(휘발성) 스캔 모드

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadState('uploading');
    setErrorMsg('');
    
    setTimeout(async () => {
      setUploadState('analyzing');
      try {
        const result = await analyzeStudentReportPDF(file);
        setAnalysisResult(result);
        setUploadState('done');
      } catch (err: any) {
        setErrorMsg(err.message || '파일 분석 중 오류가 발생했습니다.');
        setUploadState('idle');
      }
    }, 1000);
  };

  const [isSavingDB, setIsSavingDB] = useState(false);
  const handleFinalSave = async () => {
    if (!analysisResult || isQuickScan || !studentData) return;
    setIsSavingDB(true);
    try {
      await supabase.from('pdf_analyses').insert([{
        student_id: studentData.id,
        analysis_summary: analysisResult.analysisSummary,
        grades: analysisResult.grades,
        activities: analysisResult.activities
      }]);
      alert("DB에 성공적으로 누적 저장되었습니다!");
    } catch (e: any) {
      alert("DB 저장 에러: " + e.message);
    }
    setIsSavingDB(false);
  };

  return (
    <div className="student-detail-view">
      <div className="detail-header glass-panel">
        <button className="icon-btn secondary" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div className="student-meta">
          <h2>{studentData ? `${studentData.name} 학생 (정규 스캔)` : '빠른 생기부 스캔 (미등록 체험)'}</h2>
          {studentData && <span className="tag-goal">목표 진로/전공</span>}
        </div>
        <div className="detail-tabs">
          {studentData && (
            <button 
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              종합 정보
            </button>
          )}
          <button 
            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            생기부 원본 분석
          </button>
        </div>
      </div>

      <div className="detail-content">
        {activeTab === 'info' && studentData && (
          <div className="full-info-dashboard">
            <div className="info-grid top-row">
              <div className="glass-panel profile-card">
                <div className="profile-header">
                  <div className="avatar-large">{studentData.name.charAt(0)}</div>
                  <div>
                    <h3>{studentData.name}</h3>
                    <p>학생 고유 ID: {studentData.id.slice(0, 8)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          uploadState !== 'done' ? (
            <div className="upload-section glass-panel">
              <label className="upload-box" style={{ cursor: 'pointer', display: 'block' }}>
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                  disabled={uploadState !== 'idle'}
                />
                {uploadState === 'idle' && (
                  <>
                    <UploadCloud size={64} className="upload-icon" />
                    <h3>나이스/정부24 생기부 PDF 업로드</h3>
                    <p>클릭하여 파일을 선택하세요. (구글 AI가 PDF를 0.5초만에 분석합니다)</p>
                    <div className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>생기부 문서 선택</div>
                    {errorMsg && <p style={{ color: '#f43f5e', marginTop: '12px' }}>{errorMsg}</p>}
                  </>
                )}
                {uploadState === 'uploading' && (
                  <div className="processing">
                    <div className="spinner"></div>
                    <h3>파일 로드 중...</h3>
                  </div>
                )}
                {uploadState === 'analyzing' && (
                  <div className="processing">
                    <FileText size={48} className="upload-icon animate-pulse" />
                    <h3>생기부 AI 해독 중... (Gemini 2.5 Pro)</h3>
                    <p>플래그십 모델 가동 중: 모든 맥락을 읽고 요약/분석 데이터를 구성하고 있습니다.</p>
                  </div>
                )}
              </label>
            </div>
          ) : (
            <div className="analysis-results">
              <div className="results-grid">
                <div className="glass-panel main-analysis">
                  <div className="section-header">
                    <h3><BarChart2 size={20} /> 교과 성적 분석 대시보드 (AI 시각화)</h3>
                  </div>

                  <div className="grade-visual-area" style={{ display: 'flex', gap: '20px', marginBottom: '32px', minHeight: '320px' }}>
                    {/* 왼쪽: 방사형 차트 (과목별 역량) */}
                    <div className="radar-chart-container" style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center' }}>과목별 역량 밸런스</h5>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={prepareChartData(analysisResult.grades)}>
                          <PolarGrid stroke="#475569" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />
                          <Radar name="성적" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 중앙: 꺾은선 차트 (학기별 추이) */}
                    <div className="trend-chart-container" style={{ flex: 1.2, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center' }}>학기별 성적 추이 (평균 등급)</h5>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareTrendData(analysisResult.grades)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="semester" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis reversed domain={[1, 9]} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(_value: any, _name: any, props: any) => [`${props.payload.actualGrade} 등급`, '평균 성적']}
                          />
                          <Line type="monotone" dataKey="chartValue" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 오른쪽: 주요 지표 요약 */}
                    <div className="grade-summary-stats" style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {prepareChartData(analysisResult.grades).map((d: any) => (
                         <div key={d.subject} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', borderLeft: `3px solid ${d.value > 7 ? '#10b981' : d.value > 4 ? '#f59e0b' : '#ef4444'}` }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.subject}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{d.actualGrade} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>등급</span></div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* 정밀 내신 분석 요약 영역 (엑셀 스타일) */}
                  {prepareDetailedStats(analysisResult.grades) && (
                    <div className="detailed-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                      {/* 학년별 누적 분석 */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Activity size={18} color="#10b981" /> 학년별 누적 내신 변화
                        </h4>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart data={prepareDetailedStats(analysisResult.grades)?.cumulative.map((item: any) => ({
                                ...item,
                                chartValue: item.value === '-' ? 0 : (10 - parseFloat(item.value))
                              }))}>
                                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis reversed domain={[1, 9]} hide />
                                <Bar dataKey="chartValue" radius={[4, 4, 0, 0]}>
                                  {prepareDetailedStats(analysisResult.grades)?.cumulative.map((_entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={index === 2 ? '#6366f1' : '#475569'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {prepareDetailedStats(analysisResult.grades)?.cumulative.map((item: any) => (
                              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: '#94a3b8' }}>{item.label}</span>
                                <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 과목군별 성적 분석 */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Award size={18} color="#f59e0b" /> 주요 과목군별 평점
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {prepareDetailedStats(analysisResult.grades)?.groups.map((item: any) => (
                            <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>{item.label}</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analysisResult?.analysisSummary && (
                    <div className="ai-summary-box" style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
                      <h4 style={{ color: '#a5b4fc', marginTop: 0, marginBottom: '12px' }}>💡 전문가 종합 평가</h4>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>{analysisResult.analysisSummary}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <h4 style={{ margin: 0, color: '#e2e8f0' }}>주요 교과 세특 및 성적 (컨설턴트 수동 검수창)</h4>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>AI 추출 결과 중 학점(단위)/등급 숫자가 이상하면 직접 고치세요.</span>
                  </div>
                  
                  <div className="grades-editor-table" style={{ marginBottom: '20px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <tr>
                          <th style={{ padding: '10px', width: '15%' }}>학기</th>
                          <th style={{ padding: '10px', width: '20%' }}>과목명</th>
                          <th style={{ padding: '10px', width: '15%' }}>단위수</th>
                          <th style={{ padding: '10px', width: '15%' }}>등급수</th>
                          <th style={{ padding: '10px', width: '35%' }}>세특 핵심 분석</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisResult?.grades?.map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '10px' }}>
                              <input type="text" value={item.semester || ''} 
                                onChange={(e) => { const newGrades = [...analysisResult.grades]; newGrades[idx].semester = e.target.value; setAnalysisResult({...analysisResult, grades: newGrades}); }}
                                style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid #475569', borderRadius: '4px' }} />
                            </td>
                            <td style={{ padding: '10px' }}>{item.subject}</td>
                            <td style={{ padding: '10px' }}>
                              <input type="number" value={item.credit || 0} 
                                onChange={(e) => { const newGrades = [...analysisResult.grades]; newGrades[idx].credit = parseFloat(e.target.value); setAnalysisResult({...analysisResult, grades: newGrades}); }}
                                style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid #475569', borderRadius: '4px' }} />
                            </td>
                            <td style={{ padding: '10px' }}>
                              <input type="number" value={item.score || 0} 
                                onChange={(e) => { const newGrades = [...analysisResult.grades]; newGrades[idx].score = parseFloat(e.target.value); setAnalysisResult({...analysisResult, grades: newGrades}); }}
                                style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid #475569', borderRadius: '4px' }} />
                            </td>
                            <td style={{ padding: '10px', fontSize: '0.9rem', color: '#cbd5e1' }}>{item.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
                     <button className="btn-secondary" onClick={() => {
                        import('../lib/gradeCalculator').then(({ calculateGPA }) => {
                          const calcResult = calculateGPA(analysisResult.grades, '2015');
                          alert(`[내신 임시 계산 결과]\n총 평균 등급: ${calcResult.totalAverage}\n주요 교과 평균: ${calcResult.majorAverage}`);
                        });
                     }}>
                       내신 가계산 돌려보기
                     </button>
                     {!isQuickScan && (
                       <button className="btn-primary" onClick={handleFinalSave} disabled={isSavingDB}>
                         {isSavingDB ? '저장 중...' : '숫자 검수 완료 및 DB 업로드'}
                       </button>
                     )}
                     {isQuickScan && (
                       <button className="btn-primary" style={{ background: '#64748b', cursor: 'not-allowed' }}>
                         (미등록 빠른 스캔 모드: 저장 불가)
                       </button>
                     )}
                  </div>
                  
                  <h4 style={{ marginTop: '32px', marginBottom: '16px', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>창체 / 동아리 활동 내역 요약</h4>
                  {analysisResult?.activities?.map((item: any, idx: number) => (
                    <div className="subject-box" key={`act-${idx}`} style={{ borderLeftColor: '#10b981' }}>
                      <div className="subject-head">
                        <h4>{item.title}</h4>
                      </div>
                      <p className="setek-text">{item.detail}</p>
                    </div>
                  ))}
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
