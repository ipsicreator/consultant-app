import React from 'react';
import { Calendar, Printer, Plus, CheckSquare, Clock } from 'lucide-react';
import './MonthlyPlanner.css';

interface MonthlyPlannerProps {
  onBack?: () => void;
}

const MonthlyPlanner: React.FC<MonthlyPlannerProps> = () => {
  const currentMonth = "2026년 4월";
  const studentInfo = {
    name: "김지민",
    school: "서울과학고 2학년",
    consultant: "크리스 수석",
  };

  const tasks = [
    { id: 1, type: "exam", title: "1학기 중간고사 (수학/과학 중심 대비)", status: "pending" },
    { id: 2, type: "report", title: "통합과학 심화 탐구 보고서 (엔지니어링 연계)", status: "in-progress" },
    { id: 3, type: "book", title: "추천 도서 완독: '수학의 확실성'", status: "done" },
    { id: 4, type: "activity", title: "자율동아리 계획서 선생님 제출", status: "done" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="planner-container">
      {/* 화면용 툴바 (인쇄 시 숨김 처리됨) */}
      <div className="planner-toolbar glass-panel no-print">
        <div className="toolbar-left">
          <Calendar size={24} className="accent-icon" />
          <h2>월간 활동 점검 & 플래너</h2>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary">
            <Plus size={18} /> 새 활동 추가
          </button>
          <button className="btn-primary" onClick={handlePrint}>
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
          <h1 className="report-title">{currentMonth} 활동 점검표</h1>
          
          <div className="student-profile-bar">
            <div className="sp-item"><span>원생명:</span> <strong>{studentInfo.name}</strong></div>
            <div className="sp-item"><span>학교/학년:</span> <strong>{studentInfo.school}</strong></div>
            <div className="sp-item"><span>담당 컨설턴트:</span> <strong>{studentInfo.consultant}</strong></div>
          </div>
        </div>

        <div className="report-body">
          <div className="section">
            <h3 className="section-heading">이달의 목표</h3>
            <p className="monthly-goal">
              다가오는 중간고사(지필) 대비에 총력을 다하며, 
              평가 이후 제출할 과학/수학 심화 보고서의 초안을 미리 설계합니다.
            </p>
          </div>

          <div className="section">
            <h3 className="section-heading">상세 활동 리스트</h3>
            <table className="task-table">
              <thead>
                <tr>
                  <th width="15%">구분</th>
                  <th width="50%">활동 내용</th>
                  <th width="15%">상태</th>
                  <th width="20%">확인 (서명)</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <span className={`task-badge type-${task.type}`}>
                        {task.type === 'exam' && '내신관리'}
                        {task.type === 'report' && '보고서'}
                        {task.type === 'book' && '독서'}
                        {task.type === 'activity' && '창체활동'}
                      </span>
                    </td>
                    <td className="task-title">{task.title}</td>
                    <td>
                      <span className={`status-text ${task.status}`}>
                        {task.status === 'done' && <><CheckSquare size={14}/> 완료</>}
                        {task.status === 'in-progress' && <><Clock size={14}/> 진행중</>}
                        {task.status === 'pending' && '대기'}
                      </span>
                    </td>
                    <td className="signature-cell"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3 className="section-heading">코칭 코멘트 (종합 의견)</h3>
            <div className="comment-box">
              <p>
                지민 학생, 이번 달은 내신 관리가 가장 중요합니다. 동아리 계획서는 성공적으로 제출했으니
                남은 기간은 오답 노트 정리에 집중하세요. 보고서는 시험 직후 주말에 최종 다듬어서 올립시다.
              </p>
              <div className="sign-area">
                <span>컨설턴트 확인: ____________ (서명)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="report-footer">
          <p>본 월간 점검표는 AI_학생부관리전문가1.0 시스템을 통해 자동 생성되었습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPlanner;
