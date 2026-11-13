import { useEffect, useState } from 'react';
import { SUPREMA_LAB_URL } from '../../../lib/lab';
import { sharedAdmissionRows } from '../../../lib/labContract';
import type { AdmissionRow } from '../../../lib/labContract';
export function useAdmissionData() {
  const [rows, setRows] = useState<AdmissionRow[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController();
    fetch(SUPREMA_LAB_URL + '/api/admissions', { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('공통 입시 자료 연결을 확인해 주세요.'); return sharedAdmissionRows(await response.json()); })
      .then(data => { if (!controller.signal.aborted) setRows(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '공통 입시 자료를 불러오지 못했습니다.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return { rows, loading, error };
}
