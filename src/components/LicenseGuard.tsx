import React, { useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase';
import { resolveOrCreateProfile } from '../lib/profileLink';
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
    const pickBestActiveLicense = async () => {
      const activeLicenses = await pb.collection('suprima_licenses').getFullList({
        filter: 'active=true',
        sort: '-updated,-created',
      }).catch(() => []);

      if (!activeLicenses.length) return null;

      // Prefer explicit academy licenses over empty academy_id placeholders.
      const withAcademy = activeLicenses.find((l: any) => Boolean(l.academy_id));
      return (withAcademy ?? activeLicenses[0]) as any;
    };

    const run = async () => {
      try {
        if (!pb.authStore.isValid || !pb.authStore.model) {
          setState({ active: false, loading: false });
          return;
        }

        const profile = await resolveOrCreateProfile();

        if (!profile?.academy_id) {
          // Fallback path for legacy DBs where user-profile linkage is missing.
          const fallbackLicense = await pickBestActiveLicense();
          const active = Boolean((fallbackLicense as any)?.active ?? false);
          if (!active) {
            setState({ active: false, loading: false });
            return;
          }

          // Cache derived academy info so downstream screens can query data consistently.
          sessionStorage.setItem('academy_id_fallback', String((fallbackLicense as any).academy_id || ''));
          sessionStorage.setItem('license_mode', 'fallback');
          setState({ active: true, loading: false });
          return;
        }

        if (profile.role === 'master') {
          setState({ active: true, loading: false });
          return;
        }

        const license = await pb
          .collection('suprima_licenses')
          .getFirstListItem(`academy_id="${profile.academy_id}" && active=true`)
          .catch(() => null);

        const active = Boolean((license as any)?.active ?? (license as any)?.is_active ?? false);
        if (active) {
          sessionStorage.setItem('academy_id_fallback', String(profile.academy_id));
          sessionStorage.setItem('license_mode', 'profile');
        }
        setState({ active, loading: false });
      } catch (e) {
        console.error('License check failed:', e);
        setState({ active: false, loading: false });
      }
    };

    run();
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
          <h1>사용 권한이 만료되었습니다.</h1>
          <p>
            현재 서비스 이용 권한이 비활성화 상태입니다.
            <br />
            계속 이용하시려면 관리자 또는 본사로 문의해 주세요.
          </p>
          <div className="contact-info">
            <PhoneCall size={18} />
            <span>고객센터: 010-2370-1077 (대치수프리마 입시&코칭센터)</span>
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
