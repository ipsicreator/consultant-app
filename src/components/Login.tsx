import React, { useState } from 'react';
import { pb, pocketbaseConfigured } from '../lib/pocketbase';
import { resolveOrCreateProfile } from '../lib/profileLink';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import './Login.css';
import { APP_NAME } from '../lib/lab';

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
    if (!pocketbaseConfigured) { setErrorMsg('학원 연결 주소 설정이 필요합니다. 관리자에게 문의해 주세요.'); return; }
    setLoading(true);
    setErrorMsg('');

    try {
      pb.authStore.clear();
      await pb.collection('users').authWithPassword(email, password);
      await resolveOrCreateProfile();
      onLoginSuccess();
    } catch (error) {
      pb.authStore.clear();
      setErrorMsg('로그인 실패: 이메일·비밀번호와 학원 소속·역할 등록을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-box">
        <div className="login-header">
          <img src="/logo.png" alt="수프리마 랩 학원용" className="login-logo" />
          <h2>{APP_NAME} 로그인</h2>
          <p>학원 관리자 · 담당 컨설턴트 전용</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>이메일</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="name@example.com"
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
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!pocketbaseConfigured && <div className="error-message" role="alert">학원 연결 주소 설정이 필요합니다. 관리자에게 문의해 주세요.</div>}
          {errorMsg && <div className="error-message" role="alert">{errorMsg}</div>}

          <button type="submit" className="btn-primary login-btn" disabled={loading || !pocketbaseConfigured}>
            {loading ? '접속 중...' : '로그인'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={16} />
          <span>인증 상태: {pb.authStore.isValid ? '로그인됨' : '로그인 필요'}</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
