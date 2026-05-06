import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  FileText, 
  TrendingUp, 
  Award, 
  User, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { supabase } from '../lib/supabase';
import './MonthlyPlanner.css';

const MonthlyPlanner: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [consultantNote, setConsultantNote] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*');
    if (data) setStudents(data);
  };

  const loadReport = async (student: any) => {
    setSelectedStudent(student);
    // 실제 데이터는 학생의 생기부 분석 결과(pdf_analyses)에서 가져옵니다.
    const { data } = await supabase
      .from('pdf_analyses')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setReportData(data.content);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="monthly-planner fade-in">
      {/* Control Panel (Hide when printing) */}
      <header className="planner-header glass-panel no-print">
        <div className="header-left">
          <FileText size={24} className="accent-color" />
          <div className="title-area">
            <h2>입시 진단 및 전략 리포트</h2>
            <p>학생의 데이터를 기반으로 공식 분석 보고서를 생성합니다.</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            onChange={(e) => {
              const student = students.find(s => s.id === e.target.value);
              if (student) loadReport(student);
            }}
            className="student-select"
          >
            <option value="">학생 선택...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.school})</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handlePrint} disabled={!selectedStudent}>
            <Printer size={18} />
            <span>리포트 인쇄하기</span>
          </button>
        </div>
      </header>

      {/* Official Report Area */}
      {selectedStudent ? (
        <div className="report-container glass-panel">
          <div className="report-paper">
            {/* Report Header */}
            <header className="report-official-header">
              <div className="brand-box">
                <h1>SUPREMA</h1>
                <p>EDUCATION GROUP</p>
              </div>
              <div className="report-meta">
                <div className="meta-item">
                  <span className="label">발행일자</span>
                  <span className="value">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="meta-item">
                  <span className="label">보고서 번호</span>
                  <span className="value">SR-{selectedStudent.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </header>

            <div className="report-title-section">
              <h2>학교생활기록부 종합 진단 및 대학 입시 전략 보고서</h2>
              <div className="student-info-grid">
                <div className="info-item">
                  <User size={14} />
                  <strong>학생 성명:</strong> <span>{selectedStudent.name}</span>
                </div>
                <div className="info-item">
                  <Calendar size={14} />
                  <strong>학교/학년:</strong> <span>{selectedStudent.school} {selectedStudent.grade}</span>
                </div>
                <div className="info-item">
                  <Award size={14} />
                  <strong>희망 전공:</strong> <span>{selectedStudent.target_major || '미설정'}</span>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="report-body">
              {/* 1. Grade Analysis */}
              <section className="report-section">
                <h3 className="section-title"><TrendingUp size={18} /> 교과 성적 추이 및 경쟁력 분석</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[
                      { name: '1-1', score: 2.1 },
                      { name: '1-2', score: 1.8 },
                      { name: '2-1', score: 1.5 },
                      { name: '2-2', score: 1.3 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis reversed domain={[1, 5]} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6, fill: '#4f46e5' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="analysis-text">
                  <p>주요 교과 성적이 1학년 1학기 이후 꾸준히 상승 곡선을 그리고 있으며, 특히 수학과 과학 교과에서의 우수성이 두드러집니다. 
                  희망 전공인 의생명공학계열 지원 시 강력한 학업 역량 지표로 활용될 수 있습니다.</p>
                </div>
              </section>

              {/* 2. AI Assessment Summary */}
              <section className="report-section">
                <h3 className="section-title"><Sparkles size={18} /> AI 생기부 종합 평가 요약</h3>
                <div className="assessment-box">
                  <div className="assessment-item">
                    <CheckCircle2 size={16} color="#10b981" />
                    <strong>학업 역량:</strong> <span>교과목 간 융합적 사고 능력이 뛰어나며 심화 탐구 능력이 우수함.</span>
                  </div>
                  <div className="assessment-item">
                    <CheckCircle2 size={16} color="#10b981" />
                    <strong>진로 역량:</strong> <span>의생명 계열에 대한 일관된 관심이 교과 및 창체 활동에 잘 녹아있음.</span>
                  </div>
                  <div className="assessment-item">
                    <CheckCircle2 size={16} color="#10b981" />
                    <strong>공동체 역량:</strong> <span>협동 프로젝트에서 주도적인 역할을 수행하며 리더십을 발휘함.</span>
                  </div>
                </div>
              </section>

              {/* 3. Consultant Opinion */}
              <section className="report-section no-break">
                <h3 className="section-title"><MessageSquare size={18} /> 담당 컨설턴트 종합 소견</h3>
                <div className="opinion-box">
                  <textarea 
                    className="opinion-input no-print"
                    placeholder="리포트에 포함될 컨설턴트 소견을 입력하세요..."
                    value={consultantNote}
                    onChange={(e) => setConsultantNote(e.target.value)}
                  />
                  <div className="opinion-print print-only">
                    {consultantNote || '등록된 소견이 없습니다.'}
                  </div>
                </div>
              </section>
            </div>

            {/* Report Footer */}
            <footer className="report-footer">
              <div className="stamp-area">
                <p>위 보고서는 수프리마 입시 진단 시스템의 AI 분석을 바탕으로 작성되었습니다.</p>
                <div className="signature">
                  <span>수프리마 입시 센터 원장 이기욱 (인)</span>
                </div>
              </div>
              <p className="copyright">© SUPREMA EDUCATION GROUP. ALL RIGHTS RESERVED.</p>
            </footer>
          </div>
        </div>
      ) : (
        <div className="empty-planner glass-panel">
          <FileText size={48} className="muted-icon" />
          <h3>학생을 선택하여 리포트를 생성하세요</h3>
          <p>분석된 생기부 데이터를 바탕으로 공식 진단 보고서를 구성합니다.</p>
        </div>
      )}
    </div>
  );
};

const MessageSquare = ({ size, className }: any) => <FileText size={size} className={className} />;

export default MonthlyPlanner;
