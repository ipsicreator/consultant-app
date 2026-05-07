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
import { pb } from './lib/pocketbase'; // PocketBase 라이브러리 사용

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [currentView, setCurrentView] = useState<'dashboard' | 'student' | 'exploration' | 'admin' | 'planner' | 'settings'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // PocketBase 인증 상태 변화 감지
    return pb.authStore.onChange((_token, _model) => {
      setIsAuthenticated(pb.authStore.isValid);
    });
  }, []);

  const handleNavigate = (view: string) => {
    if (view === 'student') {
      setSelectedStudent(null);
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
