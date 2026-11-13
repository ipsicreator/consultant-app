export function labBaseUrl(value?: string): string {
  const url = new URL(value?.trim() || 'https://suprema-lab.vercel.app');
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new Error('수프리마 랩 연결 주소 설정을 확인해 주세요.');
  return url.origin;
}

export type AdmissionRow = {
  region: string; subRegion: string; univ: string; track: string; dept: string; type: string; name: string;
  cutoff24: number | null; cutoff25: number | null; cutoff26: number | null; req: string;
  [key: string]: unknown;
};

export function sharedAdmissionRows(value: unknown): AdmissionRow[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('공통 입시 자료 응답이 올바르지 않습니다.');
  const payload = value as Record<string, unknown>;
  if (payload.success !== true || !Array.isArray(payload.rows)) throw new Error('공통 입시 자료를 불러오지 못했습니다.');
  return payload.rows.map((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('입시 자료 형식을 확인해 주세요.');
    const row = item as Record<string, unknown>;
    for (const key of ['univ', 'dept', 'type', 'name']) if (typeof row[key] !== 'string' || !row[key].trim()) throw new Error('입시 자료의 대학·전형 정보가 누락되었습니다.');
    const text = (key: string) => typeof row[key] === 'string' ? row[key] as string : '';
    const cutoff = (key: string) => typeof row[key] === 'number' && Number.isFinite(row[key]) && row[key] >= 1 && row[key] <= 9 ? row[key] as number : null;
    return { ...row, region: text('region'), subRegion: text('subRegion'), univ: text('univ'), track: text('track'), dept: text('dept'), type: text('type'), name: text('name'), cutoff24: cutoff('cutoff24'), cutoff25: cutoff('cutoff25'), cutoff26: cutoff('cutoff26'), req: text('req') };
  });
}
