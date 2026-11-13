import { pb } from './pocketbase';
import { labBaseUrl } from './labContract';
export const SUPREMA_LAB_URL = labBaseUrl(import.meta.env.VITE_SUPREMA_LAB_URL);
export const APP_NAME = import.meta.env.VITE_APP_NAME?.trim() || '수프리마 랩 학원용';
export async function requestLabAI(operation: string, payload: Record<string, unknown>): Promise<any> {
  if (!pb.authStore.isValid || !pb.authStore.token) throw new Error('로그인한 학원 계정으로 다시 접속해 주세요.');
  const body = JSON.stringify({ ...payload, operation });
  if (new Blob([body]).size > 3 * 1024 * 1024) throw new Error('전송할 자료가 너무 큽니다. PDF를 2MB 이하로 나누어 주세요.');
  const response = await fetch(SUPREMA_LAB_URL + '/api/academy/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + pb.authStore.token }, body });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || '수프리마 랩 분석 연결에 실패했습니다. 관리자에게 설정을 확인해 주세요.');
  if (!result || typeof result !== 'object') throw new Error('분석 응답을 확인하지 못했습니다. 다시 시도해 주세요.');
  return result;
}

export async function requestAdmissionDiagnosis(studentIndex: number, gradingSystem: '9-level' | '5-level', row: { univ: string; dept: string; type: string; name: string }): Promise<{ level: string; reason: string }> {
  const response = await fetch(SUPREMA_LAB_URL + '/api/diagnosis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentIndex, gradingSystem, choices: [{ university: row.univ, department: row.dept, admission_type: row.type, track_name: row.name }] }) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || '전형 진단을 완료하지 못했습니다.');
  const result = data?.results?.[0];
  if (typeof result?.level !== 'string' || typeof result?.comment !== 'string') throw new Error('전형 진단 응답을 확인해 주세요.');
  return { level: result.level, reason: result.comment };
}
export async function pdfPayload(file: File): Promise<{ data: string; mimeType: string }> {
  if (file.type !== 'application/pdf' || file.size <= 0) throw new Error('PDF 파일을 선택해 주세요.');
  if (file.size > 2 * 1024 * 1024) throw new Error('PDF는 최대 2MB입니다. 페이지를 나누어 올려 주세요.');
  const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.')); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.readAsDataURL(file); });
  return { data, mimeType: 'application/pdf' };
}
