import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Upload,
  ArrowRight,
  BarChart2,
  MessageSquare,
  Circle
} from 'lucide-react';
import { pb } from '../lib/pocketbase';
import './MonthlyPlanner.css';

type TaskStatus = 'todo' | 'in_progress' | 'done';

interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  week: number;
  fileName?: string;
}

const MonthlyPlanner: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [consultantNote, setConsultantNote] = useState('');
  
  // Kanban Tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: '기후 변화 모델링 추천 도서 완독', status: 'done', week: 1 },
    { id: '2', text: '희망 전공 관련 시사 뉴스 3개 요약', status: 'in_progress', week: 1 },
    { id: '3', text: '실험 설계안 1차 기획안 제출', status: 'todo', week: 2 },
  ]);
  
  const [newTaskText, setNewTaskText] = useState('');
  const [uploadModalTask, setUploadModalTask] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      const records = await pb.collection('suprima_students').getFullList();
      setStudents(records);
    } catch (error) {
      console.error("Fetch students error:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
    
    // Listen for instant transfers from ExplorationModule
    const handleTransfer = (e: any) => {
      if (e.detail && e.detail.title) {
        setTasks(prev => [...prev, {
          id: Date.now().toString() + Math.random().toString(),
          text: `[탐구활동] ${e.detail.title}`,
          status: 'todo',
          week: 1
        }]);
      }
    };
    window.addEventListener('TRANSFER_TO_PLANNER', handleTransfer);
    return () => window.removeEventListener('TRANSFER_TO_PLANNER', handleTransfer);
  }, []);

  const loadReport = (student: any) => {
    setSelectedStudent(student);
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, status: 'todo', week: 1 }]);
    setNewTaskText('');
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const moveTask = (id: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file upload delay
      setTimeout(() => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, fileName: file.name } : t));
        setUploadModalTask(null);
        alert(`${file.name} 결과물이 ${selectedStudent?.name || '학생'}에게 매칭되어 누적(업로드)되었습니다!`);
      }, 500);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const renderKanbanColumn = (status: TaskStatus, title: string, icon: React.ReactNode) => {
    const colTasks = tasks.filter(t => t.status === status);
    return (
      <div className={`kanban-col ${status}`}>
        <div className="col-header">
          {icon}
          <h4>{title}</h4>
          <span className="col-count">{colTasks.length}</span>
        </div>
        <div className="kanban-cards">
          {colTasks.map(task => (
            <div key={task.id} className="kanban-card">
              <div className="k-card-header">
                <span className="k-week">{task.week}주차</span>
                <button className="icon-btn delete-btn" onClick={() => removeTask(task.id)}><Trash2 size={14}/></button>
              </div>
              <p className="k-text">{task.text}</p>
              
              {task.fileName && (
                <div className="uploaded-file-badge">
                  <FileText size={14} /> {task.fileName}
                </div>
              )}

              <div className="k-actions">
                {status === 'todo' && (
                  <button className="k-move-btn" onClick={() => moveTask(task.id, 'in_progress')}>
                    진행중으로 이동 <ArrowRight size={14} />
                  </button>
                )}
                {status === 'in_progress' && (
                  <button className="k-move-btn success" onClick={() => moveTask(task.id, 'done')}>
                    완료 처리 <CheckCircle2 size={14} />
                  </button>
                )}
                {status === 'done' && !task.fileName && (
                  <button className="k-move-btn upload" onClick={() => setUploadModalTask(task.id)}>
                    결과물 업로드 <Upload size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {colTasks.length === 0 && <div className="empty-col">항목이 없습니다</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="monthly-planner fade-in">
      <header className="planner-header glass-panel">
        <div className="header-left">
          <Calendar size={24} className="accent-color" />
          <div className="title-area">
            <h2>칸반형 학습 및 입시 플래너</h2>
            <p>과제를 상태별(할 일-진행중-완료)로 관리하고 산출물을 학생에게 누적합니다.</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            onChange={(e) => {
              const student = students.find(s => s.id === e.target.value);
              if (student) loadReport(student);
              else setSelectedStudent(null);
            }}
            className="student-select"
          >
            <option value="">학생 선택...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.school})</option>
            ))}
          </select>
        </div>
      </header>

      {selectedStudent ? (
        <div className="planner-content">
          <section className="planner-dashboard glass-panel fade-in">
            <div className="dash-card">
              <div className="dash-icon"><Clock size={24} color="#0ea5e9" /></div>
              <div className="dash-info">
                <span>다가오는 주요 일정</span>
                <h3>1학기 기말고사 D-15</h3>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-icon"><Target size={24} color="#f43f5e" /></div>
              <div className="dash-info">
                <span>희망 목표 대학/전공</span>
                <h3>성균관대 의생명공학과</h3>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-icon"><TrendingUp size={24} color="#10b981" /></div>
              <div className="dash-info">
                <span>현재 내신 추정치</span>
                <h3>2.1 등급 <small className="gap-text">(목표대비 -0.3)</small></h3>
              </div>
            </div>
          </section>

          <div className="planner-grid">
            {/* Left Panel: Kanban Board */}
            <section className="planner-tasks glass-panel">
              <div className="section-head">
                <h3><FileText size={20} /> 이번 달 탐구 과제 (칸반보드)</h3>
              </div>

              <div className="task-adder kanban-adder">
                <input 
                  type="text" 
                  placeholder="새로운 과제를 입력하거나 [탐구활동 제안]에서 가져오세요..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
                <button className="add-task-btn" onClick={addTask}><Plus size={20} /></button>
              </div>

              <div className="kanban-board">
                {renderKanbanColumn('todo', '할 일 (To Do)', <Circle size={18} color="#94a3b8" />)}
                {renderKanbanColumn('in_progress', '진행 중 (In Progress)', <Clock size={18} color="#0ea5e9" />)}
                {renderKanbanColumn('done', '완료 및 산출물 (Done)', <CheckCircle2 size={18} color="#10b981" />)}
              </div>
            </section>

            {/* Right Panel: Analytics & Feedback */}
            <div className="planner-sidebar">
              <section className="planner-analytics glass-panel">
                <div className="section-head">
                  <h3><BarChart2 size={20} /> 월간 성취도 분석</h3>
                </div>
                
                <div className="progress-container">
                  <div className="progress-circle-wrap">
                    <svg className="progress-circle" viewBox="0 0 36 36">
                      <path className="circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path className="circle-bar"
                        strokeDasharray={`${progressPercent}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="progress-text">
                      <span className="percent">{progressPercent}%</span>
                      <span className="label">달성률</span>
                    </div>
                  </div>
                  <div className="progress-stats">
                    <div className="stat">
                      <span className="s-label">완료 과제</span>
                      <strong className="s-val text-green">{completedTasks}건</strong>
                    </div>
                    <div className="stat">
                      <span className="s-label">남은 과제</span>
                      <strong className="s-val text-red">{totalTasks - completedTasks}건</strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="planner-feedback glass-panel">
                <div className="section-head">
                  <h3><MessageSquare size={20} /> 컨설턴트 밀착 피드백</h3>
                </div>
                <div className="feedback-body">
                  <p className="feedback-hint">학생 및 학부모님께 발송될 코멘트입니다.</p>
                  <textarea 
                    className="feedback-input"
                    placeholder="이번 주 학생의 활동 진척도나 보완해야 할 점을 기록하세요..."
                    value={consultantNote}
                    onChange={(e) => setConsultantNote(e.target.value)}
                  />
                  <button className="btn-primary w-full mt-3">피드백 저장</button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-planner glass-panel">
          <Calendar size={64} className="muted-icon" />
          <h3>학생을 선택하여 칸반 플래너를 시작하세요</h3>
          <p>과제를 투두/진행중/완료로 구분하고 학생별 산출물을 누적할 수 있습니다.</p>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalTask && (
        <div className="upload-modal-overlay fade-in">
          <div className="upload-modal glass-panel">
            <h3><Upload size={20} /> 탐구활동 결과물 업로드 (학생 매칭)</h3>
            <p>이 산출물은 <strong>{selectedStudent?.name}</strong> 학생의 아카이브에 영구 누적됩니다.</p>
            <div className="upload-dropzone">
              <input type="file" onChange={(e) => handleFileUpload(e, uploadModalTask)} />
              <div className="dropzone-content">
                <FileText size={32} color="#0ea5e9" />
                <span>PDF, HWP, Word 파일을 선택하거나 드래그하세요.</span>
              </div>
            </div>
            <button className="cancel-btn mt-3" onClick={() => setUploadModalTask(null)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyPlanner;
