import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentDetail from './components/StudentDetail';
import ExplorationModule from './components/ExplorationModule';
import AdminDashboard from './components/AdminDashboard';
import MonthlyPlanner from './components/MonthlyPlanner';
import Settings from './components/Settings';
import Login from './components/Login';
import LicenseGuard from './components/LicenseGuard';
import { supabase } from './lib/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'student' | 'exploration' | 'admin' | 'planner' | 'settings'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // 앱 로드 시 기존 로그인 정보 체크
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });

    // 실시간 로그인 상태 변화 감지
    supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const handleNavigate = (view: string) => {
    if (view === 'student') {
      setSelectedStudent(null); // 사이드바에서 '빠른 스캔' 클릭 시 기존 선택 학생 해제
    }
    setCurrentView(view as any);
  };

  const handleStudentSelect = (id: string, name: string) => {
    setSelectedStudent({ id, name });
    setCurrentView('student');
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <LicenseGuard>
      <div className="app-container">
        <Sidebar 
          currentView={currentView} 
          onNavigate={handleNavigate} 
        />
        <div className="main-content">
          {currentView === 'dashboard' && (
            <Dashboard onSelectStudent={handleStudentSelect} />
          )}
          {currentView === 'student' && (
            <StudentDetail 
              studentData={selectedStudent}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'exploration' && (
            <ExplorationModule 
              onBack={() => setCurrentView('dashboard')} 
              studentData={selectedStudent}
            />
          )}
          {currentView === 'admin' && (
            <AdminDashboard />
          )}
          {currentView === 'planner' && (
            <MonthlyPlanner />
          )}
          {currentView === 'settings' && (
            <Settings />
          )}
        </div>
      </div>
    </LicenseGuard>
  );
}

export default App;
