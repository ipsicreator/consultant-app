import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // 실제로는 원장님이 Supabase 대시보드에서 등록한 계정으로 로그인 (또는 현재는 우회 허용)
    if (email === 'admin@suprima.com' && password === '1234') {
      onLoginSuccess();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 에러 시 임시 통과 (UI 테스트용 하드코딩)
      if (email === 'test' && password === 'test') {
        onLoginSuccess();
      } else {
        setErrorMsg('이메일 또는 비밀번호가 일치하지 않습니다. (테스트용: test / test)');
      }
    } else {
      onLoginSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-glass-box">
        <div className="login-header">
          <img src="/logo.png" alt="대치수프리마" className="login-logo"/>
          <h2>마스터/컨설턴트 시스템 접속</h2>
          <p>AI_학생부관리전문가1.0 플랫폼입니다.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>이메일 주소</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="text" 
                placeholder="email@example.com (테스트: test)" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>비밀번호</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="•••••••• (테스트: test)" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? '인증 중...' : '시스템 로그인'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={16} /> 
          <span>허가된 관리자 및 입시컨설턴트 외 접근을 금지합니다.</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
