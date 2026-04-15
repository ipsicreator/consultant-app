import React, { useState, useEffect } from 'react';
import { 
  Calendar, Printer, Save, History 
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { prepareChartData, prepareTrendData, prepareDetailedStats } from '../lib/gradeCalculator';
import './MonthlyPlanner.css';

interface MonthlyPlannerProps {
  onBack?: () => void;
}

const MonthlyPlanner: React.FC<MonthlyPlannerProps> = () => {
  const [customPeriod, setCustomPeriod] = useState("2026.03 ~ 2026.06 누적 히스토리");
  const studentInfo = {
    name: "김지민",
    school: "서울과학고 2학년",
    consultant: "크리스 수석",
  };

  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [consultantOpinion, setConsultantOpinion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    // 하드코딩된 김지민 학생의 uuid를 찾은 뒤 누적 분석본을 가져옵니다.
    const { data: studentData } = await supabase.from('students').select('id').eq('name', '김지민').single();
    if (studentData) {
      const { data: analyses } = await supabase
        .from('pdf_analyses')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false }); // 가장 최신본이 위로
      
      if (analyses && analyses.length > 0) {
        setHistoryRecords(analyses);
        setSelectedRecordId(analyses[0].id);
        setConsultantOpinion(analyses[0].consultant_opinion || '');
      }
    }
  };

  const handleRecordSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    setSelectedRecordId(rId);
    const matched = historyRecords.find((r: any) => r.id === rId);
    if (matched) {
      setConsultantOpinion(matched.consultant_opinion || '');
    }
    setDbStatusMsg('');
  };

  const saveConsultantOpinion = async () => {
    if (!selectedRecordId) return;
    setIsSaving(true);
    setDbStatusMsg('');
    const { error } = await supabase
      .from('pdf_analyses')
      .update({ consultant_opinion: consultantOpinion })
      .eq('id', selectedRecordId);
      
    setIsSaving(false);
    if (!error) {
      setDbStatusMsg('성공적으로 저장되었습니다!');
      setTimeout(() => setDbStatusMsg(''), 3000);
    } else {
      setDbStatusMsg('저장 실패: ' + error.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activeRecord = historyRecords.find((r: any) => r.id === selectedRecordId);

  return (
    <div className="planner-container">
      {/* 화면용 툴바 (인쇄 시 숨김 처리됨) */}
      <div className="planner-toolbar glass-panel no-print">
        <div className="toolbar-left">
          <Calendar size={24} className="accent-icon" />
          <h2>월간 분석 & 종합 보고서</h2>
          
          <div className="history-selector" style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="#94a3b8" />
            <select 
              value={selectedRecordId || ''} 
              onChange={handleRecordSelect}
              style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px' }}
            >
              {historyRecords.length === 0 && <option value="">분석 기록 없음</option>}
              {historyRecords.map((r: any, idx: number) => (
                <option value={r.id} key={r.id}>
                  {new Date(r.created_at).toLocaleDateString()} 분석본 {idx === 0 ? '(최신)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="toolbar-right">
          <span style={{ color: '#10b981', fontSize: '0.9rem', marginRight: '12px' }}>{dbStatusMsg}</span>
          <button className="btn-secondary" onClick={saveConsultantOpinion} disabled={isSaving || !selectedRecordId}>
            <Save size={18} /> {isSaving ? '저장 중...' : '코멘트 DB 저장'}
          </button>
          <button className="btn-primary" onClick={handlePrint} disabled={!selectedRecordId}>
            <Printer size={18} /> 출력하기
          </button>
        </div>
      </div>

      {/* 보고서 본문 (화면 및 인쇄용) */}
      <div className="printable-report">
        <div className="report-header">
          <div className="report-brand">
            <img src="/logo.png" alt="대치수프리마 로고" className="doc-brand-logo" />
          </div>
          <h1 className="report-title">
             학생부 집중 관리 종합 보고서
          </h1>
          
          <div className="report-subtitle no-print" style={{ textAlign: 'center', marginBottom: '24px' }}>
            <input 
              type="text" 
              placeholder="예: 2026.03 ~ 2026.06 누적 히스토리" 
              style={{ width: '400px', padding: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.7)', border: '1px solid #ccc', borderRadius: '4px' }}
              value={customPeriod}
              onChange={(e) => setCustomPeriod(e.target.value)}
            />
          </div>
          <div className="report-subtitle print-only" style={{ textAlign: 'center', fontSize: '1.4rem', color: '#333', marginBottom: '24px', fontWeight: 600 }}>
             [{customPeriod}]
          </div>
          
          <div className="student-profile-bar">
            <div className="sp-item"><span>원생명:</span> <strong>{studentInfo.name}</strong></div>
            <div className="sp-item"><span>학교/학년:</span> <strong>{studentInfo.school}</strong></div>
            <div className="sp-item"><span>담당 컨설턴트:</span> <strong>{studentInfo.consultant}</strong></div>
          </div>
        </div>

        {!activeRecord ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p>아직 '생기부 원본 분석' 탭에서 분석 및 저장된 기록이 없습니다.</p>
            <p>PDF 파일을 업로드하여 AI 분석을 1회 이상 완료해야 보고서가 생성됩니다.</p>
          </div>
        ) : (
          <div className="report-body">
            {/* 등급 자동 산출 요약 대시보드 추가 */}
            {activeRecord.grades && activeRecord.grades.length > 0 && (
              <div className="section">
                <h3 className="section-heading">내신 성적 종합 분석 (AI 시각화)</h3>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  {/* 1. 숫자 요약 */}
                  <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>전과목 평균</h4>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>
                        {(() => {
                          let t = 0, c = 0;
                          activeRecord.grades.forEach((g: any) => { if(g.credit > 0 && g.score > 0) { t += g.credit * g.score; c += g.credit; } });
                          return c > 0 ? (t/c).toFixed(2) : '-';
                        })()}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: '#166534', fontSize: '0.8rem' }}>주요 교과 평균</h4>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                        {(() => {
                          let t = 0, c = 0;
                          const kws = ['국어', '수학', '영어', '과학', '사회', '역사', '도덕'];
                          activeRecord.grades.forEach((g: any) => { 
                            if(g.credit > 0 && g.score > 0 && kws.some(kw => g.subject.includes(kw))) { 
                              t += g.credit * g.score; c += g.credit; 
                            } 
                          });
                          return c > 0 ? (t/c).toFixed(2) : '-';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 2. 방사형 그래프 (과목 역량) */}
                  <div style={{ flex: 1.2, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                    <h5 style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>교과별 역량 밸런스</h5>
                    <ResponsiveContainer width="100%" height={160}>
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={prepareChartData(activeRecord.grades)}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />
                        <Radar name="성적" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 3. 꺾은선 그래프 (성적 추이) */}
                  <div style={{ flex: 1.5, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                    <h5 style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>학기별 성적 변동 추이</h5>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={prepareTrendData(activeRecord.grades)} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="semester" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis reversed domain={[1, 9]} hide />
                        <Line type="monotone" dataKey="chartValue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#34d399', fontWeight: 600, marginTop: '5px' }}>
                      {(() => {
                        const trend = prepareTrendData(activeRecord.grades);
                        if (trend.length < 2) return "";
                        const firstVal = trend[0]?.chartValue ?? 0;
                        const lastVal = trend[trend.length - 1]?.chartValue ?? 0;
                        return lastVal > firstVal ? "📈 성적 우상향 유지 중" : lastVal < firstVal ? "📉 성적 보완 필요" : "➖ 성적 유지 중";
                      })()}
                    </div>
                  </div>
                </div>

                {/* 학년별 누적 및 전략 과목군 지표 추가 */}
                {prepareDetailedStats(activeRecord.grades) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                    {/* 학년별 누적 표 */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>학년별 누적 성적 요약</h4>
                      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                        <tbody>
                          {prepareDetailedStats(activeRecord.grades)?.cumulative.map((item: any) => (
                            <tr key={item.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '6px 0', color: '#64748b' }}>{item.label}</td>
                              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>{item.value} 등급</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 전략 과목군 표 */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>전략 과목군별 평점</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {prepareDetailedStats(activeRecord.grades)?.groups.map((item: any) => (
                          <div key={item.label} style={{ background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.label.split(' ')[0]}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#334155' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="section">
              <h3 className="section-heading">AI 전문가 종합 평가 요약</h3>
              <p className="monthly-goal" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {activeRecord.analysis_summary || '전문가 요약이 존재하지 않습니다.'}
              </p>
            </div>

            <div className="section">
              <h3 className="section-heading">주요 교과 내신 및 세특 포인트</h3>
              <table className="task-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>과목 및 등급</th>
                    <th style={{ width: '80%' }}>세특 핵심 포인트 (AI 추출)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecord.grades?.map((item: any, i: number) => (
                    <tr key={('grade'+i)}>
                      <td>
                        <strong>{item.subject || '미분류'}</strong><br/>
                        <span style={{ color: '#3b82f6', fontSize: '0.9rem' }}>{item.score || '-'}</span>
                      </td>
                      <td style={{ textAlign: 'left', lineHeight: 1.5 }}>{item.note || '-'}</td>
                    </tr>
                  ))}
                  {(!activeRecord.grades || activeRecord.grades.length === 0) && (
                    <tr><td colSpan={2}>기록된 교과 정보가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="section">
              <h3 className="section-heading">비교과 (자율/동아리/진로) 핵심 내역</h3>
              <table className="task-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>활동 구분</th>
                    <th style={{ width: '80%' }}>활동 상세 요약</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecord.activities?.map((item: any, i: number) => (
                    <tr key={('act'+i)}>
                      <td><strong>{item.title}</strong></td>
                      <td style={{ textAlign: 'left', lineHeight: 1.5 }}>{item.detail}</td>
                    </tr>
                  ))}
                  {(!activeRecord.activities || activeRecord.activities.length === 0) && (
                    <tr><td colSpan={2}>기록된 비교과 정보가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="section page-break-avoid">
              <h3 className="section-heading">담당 컨설턴트 종합 의견 (코칭 코멘트)</h3>
              <div className="comment-box">
                {/* 입력 필드는 화면에만 보이고 인쇄 시에는 아래 표시용 div만 보임 */}
                <textarea 
                  className="consultant-opinion-input no-print" 
                  value={consultantOpinion} 
                  onChange={(e) => setConsultantOpinion(e.target.value)}
                  placeholder="여기에 학부모/학생용 추가 코멘트를 직접 작성하세요. (작성 후 상단의 '저장' 버튼 클릭)"
                  rows={4}
                />
                <div className="consultant-opinion-print print-only" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, minHeight: '60px' }}>
                  {consultantOpinion || "등록된 컨설턴트 의견이 없습니다."}
                </div>
                
                <div className="sign-area">
                  <span>컨설턴트 확인: ____________ (서명)</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="report-footer">
          <p>본 월간 점검표는 AI_학생부관리전문가1.0 시스템을 통해 자동 생성되었습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPlanner;
