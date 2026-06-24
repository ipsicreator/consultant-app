import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { pb } from '../lib/pocketbase';
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

    try {
      await pb.admins.authWithPassword(email, password);
      onLoginSuccess();
    } catch {
      setErrorMsg('이메일 또는 비밀번호가 일치하지 않습니다. PocketBase 관리자 계정을 사용해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-box">
        <div className="login-header">
          <img src="/logo.png" alt="교과세특전문가" className="login-logo" />
          <h2>교과세특전문가 접속</h2>
          <p>로컬 PocketBase 기반 관리 화면입니다.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>이메일 주소</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                placeholder="PocketBase 관리자 이메일"
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

          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? '인증 중...' : '시스템 로그인'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={16} />
          <span>로컬 데이터베이스 연결 상태: {pb.authStore.isValid ? '정상' : '로그인 필요'}</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
