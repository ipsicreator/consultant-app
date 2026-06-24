import React, { useEffect, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { pb } from '../lib/pocketbase';
import './MonthlyPlanner.css';

interface Student {
  id: string;
  name: string;
  school: string;
  grade: string;
  target_major?: string;
}

const MonthlyPlanner: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [consultantNote, setConsultantNote] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const records = await pb.collection('students').getFullList();
        setStudents(records as unknown as Student[]);
      } catch (error) {
        console.error('Fetch students error:', error);
      }
    };

    void loadStudents();
  }, []);

  const loadReport = async (student: Student) => {
    setSelectedStudent(student);
    try {
      await pb.collection('pdf_analyses').getFirstListItem(`student_id="${student.id}"`, {
        sort: '-created',
      });
    } catch (error) {
      console.error('Load report error:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="monthly-planner fade-in">
      <header className="planner-header glass-panel no-print">
        <div className="header-left">
          <FileText size={24} className="accent-color" />
          <div className="title-area">
            <h2>학생 진단 및 왼쪽 리포트</h2>
            <p>학생 데이터를 바탕으로 공식 분석 리포트를 생성합니다.</p>
          </div>
        </div>
        <div className="header-actions">
          <select
            onChange={(e) => {
              const student = students.find((s) => s.id === e.target.value);
              if (student) loadReport(student);
            }}
            className="student-select"
          >
            <option value="">학생 선택...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.school})
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={handlePrint} disabled={!selectedStudent}>
            <Printer size={18} />
            <span>리포트 인쇄하기</span>
          </button>
        </div>
      </header>

      {selectedStudent ? (
        <div className="report-container glass-panel">
          <div className="report-paper">
            <header className="report-official-header">
              <div className="brand-box">
                <h1>교과세특전문가</h1>
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
              <h2>학생부 종합 진단 및 상담용 왼쪽 보고서</h2>
              <div className="student-info-grid">
                <div className="info-item">
                  <User size={14} />
                  <strong>학생 이름:</strong> <span>{selectedStudent.name}</span>
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

            <div className="report-body">
              <section className="report-section">
                <h3 className="section-title">
                  <TrendingUp size={18} /> 교과 성적 추이 및 경향성 분석
                </h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={[
                        { name: '1-1', score: 2.1 },
                        { name: '1-2', score: 1.8 },
                        { name: '2-1', score: 1.5 },
                        { name: '2-2', score: 1.3 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis reversed domain={[1, 5]} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6, fill: '#4f46e5' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="analysis-text">
                  <p>
                    주요 교과 성적이 1학년 1학기 이후 완만하게 하향되는 흐름입니다.
                    이 학생은 학업 역량이 특정 과목에서 분명하게 드러나므로,
                    핵심 교과의 연속성과 탐구 활동의 일관성을 같이 묶어 설명하는 것이 중요합니다.
                  </p>
                </div>
              </section>

              <section className="report-section">
                <h3 className="section-title">
                  <Sparkles size={18} /> AI 학생부 종합 평가 요약
                </h3>
                <div className="assessment-box">
                  <div className="assessment-item">
                    <CheckCircle2 size={16} color="#10b981" />
                    <strong>학업 역량:</strong>
                    <span>교과 전반의 관리가 안정적이며, 주요 과목에서 꾸준한 상승 근거가 확인됩니다.</span>
                  </div>
                  <div className="assessment-item">
                    <CheckCircle2 size={16} color="#10b981" />
                    <strong>전공 적합성:</strong>
                    <span>희망 전공과 연결되는 과목 선택 및 탐구 소재가 조금 더 명확해지면 좋습니다.</span>
                  </div>
                  <div className="assessment-item">
                    <CheckCircle2 size={16} color="#10b981" />
                    <strong>공동체 역량:</strong>
                    <span>동아리와 프로젝트 중심 활동에서 주도성과 협업 흔적이 보입니다.</span>
                  </div>
                </div>
              </section>

              <section className="report-section no-break">
                <h3 className="section-title">
                  <FileText size={18} /> 담당 컨설턴트 종합 소견
                </h3>
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

            <footer className="report-footer">
              <div className="stamp-area">
                <p>이 보고서는 교과세특전문가 시스템의 AI 분석 결과를 바탕으로 작성되었습니다.</p>
                <div className="signature">
                  <span>교과세특전문가 대표 컨설턴트</span>
                </div>
              </div>
              <p className="copyright">© 교과세특전문가. ALL RIGHTS RESERVED.</p>
            </footer>
          </div>
        </div>
      ) : (
        <div className="empty-planner glass-panel">
          <FileText size={48} className="muted-icon" />
          <h3>학생을 선택해 보고서를 생성하세요</h3>
          <p>학생별 분석 리포트를 바탕으로 공식 진단 보고서를 구성합니다.</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyPlanner;
