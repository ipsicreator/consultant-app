import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentDetail from './components/StudentDetail';
import ExplorationModule from './components/ExplorationModule';
import AdminDashboard from './components/AdminDashboard';
import MonthlyPlanner from './components/MonthlyPlanner';
import Settings from './components/Settings';
import Login from './components/Login';
import LicenseGuard from './components/LicenseGuard';
import { pb } from './lib/pocketbase';

type ViewKey = 'dashboard' | 'student' | 'exploration' | 'admin' | 'planner' | 'settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [currentView, setCurrentView] = useState<ViewKey>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setIsAuthenticated(pb.authStore.isValid);
    });
  }, []);

  const handleNavigate = (view: ViewKey) => {
    if (view === 'student') {
      setSelectedStudent(null);
    }
    setCurrentView(view);
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
          {currentView === 'admin' && <AdminDashboard />}
          {currentView === 'planner' && <MonthlyPlanner />}
          {currentView === 'settings' && <Settings />}
        </div>
      </div>
    </LicenseGuard>
  );
}

export default App;
