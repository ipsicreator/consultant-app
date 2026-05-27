import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentDetail from './components/StudentDetail';
import ExplorationModule from './components/ExplorationModule';
import InquiryGuide from './components/InquiryGuide';
import AdminDashboard from './components/AdminDashboard';
import MonthlyPlanner from './components/MonthlyPlanner';
import Settings from './components/Settings';
import Login from './components/Login';
import LicenseGuard from './components/LicenseGuard';
import { pb } from './lib/pocketbase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!pb.authStore.model);
  const [currentView, setCurrentView] = useState<'dashboard' | 'student' | 'exploration' | 'inquiry_guide' | 'admin' | 'planner' | 'settings'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const handleGlobalNav = (e: any) => {
      if (e.detail) {
        handleNavigate(e.detail);
      }
    };
    window.addEventListener('NAVIGATE_TO', handleGlobalNav);
    
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setIsAuthenticated(!!model);
    });
    
    return () => {
      window.removeEventListener('NAVIGATE_TO', handleGlobalNav);
      unsubscribe();
    };
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
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        <div className="main-content">
          {currentView === 'dashboard' && <Dashboard onSelectStudent={handleStudentSelect} />}
          {currentView === 'student' && (
            <StudentDetail studentData={selectedStudent} onBack={() => setCurrentView('dashboard')} />
          )}
          {currentView === 'exploration' && (
            <ExplorationModule onBack={() => setCurrentView('dashboard')} studentData={selectedStudent} />
          )}
          {currentView === 'inquiry_guide' && <InquiryGuide />}
          {currentView === 'admin' && <AdminDashboard />}
          {currentView === 'planner' && <MonthlyPlanner />}
          {currentView === 'settings' && <Settings />}
        </div>
      </div>
    </LicenseGuard>
  );
}

export default App;
