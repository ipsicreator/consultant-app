import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, PhoneCall } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const [licenseStatus, setLicenseStatus] = useState<{ active: boolean; loading: boolean }>({
    active: true,
    loading: true,
  });

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 사용자의 프로필에서 academy_id를 가져옵니다.
        const { data: profile } = await supabase
          .from('profiles')
          .select('academy_id, role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'master') {
          // 마스터 계정은 라이선스 체크를 건너뜁니다.
          setLicenseStatus({ active: true, loading: false });
          return;
        }

        if (!profile?.academy_id) {
          setLicenseStatus({ active: false, loading: false });
          return;
        }

        // 라이선스 테이블에서 활성화 여부 확인
        const { data: license } = await supabase
          .from('licenses')
          .select('is_active')
          .eq('academy_id', profile.academy_id)
          .single();

        setLicenseStatus({ 
          active: license?.is_active ?? false, 
          loading: false 
        });
      } catch (error) {
        console.error('License check failed:', error);
        setLicenseStatus({ active: false, loading: false });
      }
    };

    checkLicense();
  }, []);

  if (licenseStatus.loading) {
    return (
      <div className="license-loading">
        <div className="spinner"></div>
        <p>라이선스 정보를 확인 중입니다...</p>
      </div>
    );
  }

  if (!licenseStatus.active) {
    return (
      <div className="license-blocked-overlay">
        <div className="license-card glass-panel">
          <ShieldAlert size={64} color="#ff4d4f" />
          <h1>사용 권한이 만료되었습니다</h1>
          <p>
            현재 서비스 이용 권한이 비활성화 상태입니다.<br />
            계속 이용하시려면 관리자 또는 본사에 문의해 주세요.
          </p>
          <div className="contact-info">
            <PhoneCall size={18} />
            <span>고객센터: 1588-XXXX (수프리마 본사)</span>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => supabase.auth.signOut()}
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
