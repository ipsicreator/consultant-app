import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentDetail from './components/StudentDetail';
import CoachingFeedback from './components/CoachingFeedback';
import AdminDashboard from './components/AdminDashboard';
import MonthlyPlanner from './components/MonthlyPlanner';
import Settings from './components/Settings';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'student' | 'coaching' | 'admin' | 'planner' | 'settings'>('dashboard');

  return (
    <div className="app-container">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => setCurrentView(view as any)} 
      />
      <div className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard onSelectStudent={() => setCurrentView('student')} />
        )}
        {currentView === 'student' && (
          <StudentDetail 
            onBack={() => setCurrentView('dashboard')} 
            onCoaching={() => setCurrentView('coaching')} 
          />
        )}
        {currentView === 'coaching' && (
          <CoachingFeedback onBack={() => setCurrentView('dashboard')} />
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
  );
}

export default App;
