import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { requireAcademyScope } from '../lib/profileLink';
import { canManageAcademy } from '../lib/academyScope';

export default function AcademyAdminOnly({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState('학원 관리자 권한을 확인하고 있습니다.');
  useEffect(() => { let active = true; requireAcademyScope().then(scope => { if (active) { setAllowed(canManageAcademy(scope)); setMessage('학원 관리자만 이용할 수 있습니다.'); } }).catch(() => { if (active) setMessage('계정의 학원 소속과 역할을 확인해 주세요.'); }); return () => { active = false; }; }, []);
  return allowed ? children : <p role="status">{message}</p>;
}
