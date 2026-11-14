import { useState, useEffect, useRef } from 'react';
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
import BigDataPlatform from './components/BigDataPlatform';
import AdmissionModule from './components/AdmissionModule';
import { pb } from './lib/pocketbase';
import AcademyAdminOnly from './components/AcademyAdminOnly';
import { sessionIdentity } from './lib/studentRecords';
import { APP_NAME } from './lib/lab';

function App() {
  const [authUserId, setAuthUserId] = useState(sessionIdentity);
  const identityRef = useRef(authUserId);
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [currentView, setCurrentView] = useState<'dashboard' | 'student' | 'exploration' | 'inquiry_guide' | 'admission' | 'admin' | 'planner' | 'settings' | 'bigdata'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  const handleNavigate = (view: string) => {
    if (!['dashboard', 'student', 'exploration', 'inquiry_guide', 'admission', 'admin', 'planner', 'settings', 'bigdata'].includes(view)) return;
    if (view === 'student') {
      setSelectedStudent(null);
    }
    setCurrentView(view as any);
  };


  useEffect(() => {
    const handleGlobalNav = (event: any) => {
      if (event.detail) {
        handleNavigate(event.detail);
      }
    };

    window.addEventListener('NAVIGATE_TO', handleGlobalNav);
    document.title = APP_NAME;
    const unsubscribe = pb.authStore.onChange(() => {
      const next = sessionIdentity();
      if (identityRef.current !== next) {
        identityRef.current = next; setAuthUserId(next); setSelectedStudent(null); setCurrentView('dashboard');
        sessionStorage.removeItem('exploration_keywords');
      }
      setIsAuthenticated(Boolean(next));
    });;

    return () => {
      window.removeEventListener('NAVIGATE_TO', handleGlobalNav);
      unsubscribe();
    };
  }, []);


  const handleStudentSelect = (id: string, name: string) => {
    setSelectedStudent({ id, name });
    setCurrentView('student');
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <LicenseGuard key={authUserId}>
      <div className="app-container">
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        <div className="main-content">
          {currentView === 'dashboard' && <Dashboard onSelectStudent={handleStudentSelect} />}
          {currentView === 'student' && <StudentDetail key={selectedStudent?.id || 'no-student'} studentData={selectedStudent} onBack={() => setCurrentView('dashboard')} />}
          {currentView === 'exploration' && <ExplorationModule key={selectedStudent?.id || 'no-student'} onBack={() => setCurrentView('dashboard')} studentData={selectedStudent} />}
          {currentView === 'inquiry_guide' && <InquiryGuide studentData={selectedStudent} onNavigate={handleNavigate} />}
          {currentView === 'admission' && <AdmissionModule key={selectedStudent?.id || 'no-student'} onBack={() => setCurrentView('dashboard')} studentData={selectedStudent} />}
          {currentView === 'admin' && <AcademyAdminOnly><AdminDashboard /></AcademyAdminOnly>}
          {currentView === 'planner' && <MonthlyPlanner />}
          {currentView === 'settings' && <AcademyAdminOnly><Settings /></AcademyAdminOnly>}
          {currentView === 'bigdata' && <BigDataPlatform />}
        </div>
      </div>
    </LicenseGuard>
  );
}

export default App;
