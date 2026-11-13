import React, { useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase';
import { requireAcademyScope } from '../lib/profileLink';
import { filterValue } from '../lib/academyScope';
import { ShieldAlert, PhoneCall } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const [state, setState] = useState<{ active: boolean; loading: boolean }>({
    active: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        sessionStorage.removeItem('academy_id_fallback'); sessionStorage.removeItem('license_mode');
        const scope = await requireAcademyScope();
        const license = await pb.collection('suprima_licenses').getFirstListItem('academy_id=' + filterValue(scope.academyId) + ' && active=true');
        if (active) setState({ active: license.active === true && license.academy_id === scope.academyId, loading: false });
      } catch { if (active) setState({ active: false, loading: false }); }
    };
    void run(); return () => { active = false; };
  }, []);

  if (state.loading) {
    return (
      <div className="license-loading">
        <div className="spinner"></div>
        <p>라이선스 상태 확인 중...</p>
      </div>
    );
  }

  if (!state.active) {
    return (
      <div className="license-blocked-overlay">
        <div className="license-card glass-panel">
          <ShieldAlert size={64} color="#ff4d4f" />
          <h1>학원 이용 권한을 확인해 주세요.</h1>
          <p>
            계정의 학원 소속·역할 또는 이용권을 확인하지 못했습니다.
            <br />
            계속 이용하시려면 관리자 또는 본사로 문의해 주세요.
          </p>
          <div className="contact-info">
            <PhoneCall size={18} />
            <span>고객센터: 010-2370-1077 (수프리마 랩)</span>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              pb.authStore.clear();
              window.location.reload();
            }}
          >
            로그아웃 후 재접속
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LicenseGuard;
