import { pb } from './pocketbase';
import { SUPREMA_LAB_URL } from './lab';

export type AssignmentStudent = { id: string; name: string; assigned_consultant: string; updated: string };
export type AssignmentConsultant = { id: string; name: string; role: 'consultant' };
export type AssignmentRoster = { assignmentField: 'assigned_consultant'; students: AssignmentStudent[]; consultants: AssignmentConsultant[] };

function session() {
  const userId = pb.authStore.model?.collectionName === 'users' ? pb.authStore.model.id : '';
  if (!pb.authStore.isValid || !userId || !pb.authStore.token) throw new Error('로그인한 학원 계정으로 다시 접속해 주세요.');
  return { userId, token: pb.authStore.token };
}
function currentSession(captured: ReturnType<typeof session>): void {
  const current = session();
  if (current.userId !== captured.userId || current.token !== captured.token) throw new Error('로그인 계정이 변경되었습니다. 다시 확인해 주세요.');
}
function object(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function text(value: unknown, allowEmpty = false): value is string { return typeof value === 'string' && (allowEmpty || Boolean(value)); }

export function validateAssignmentRoster(value: unknown): AssignmentRoster {
  if (!object(value) || value.assignmentField !== 'assigned_consultant' || !Array.isArray(value.students) || !Array.isArray(value.consultants)) throw new Error('학생 배정 정보를 확인하지 못했습니다.');
  const students = value.students.map(row => {
    if (!object(row) || !text(row.id) || !text(row.name, true) || !text(row.assigned_consultant, true) || !text(row.updated)) throw new Error('학생 배정 정보를 확인하지 못했습니다.');
    return { id: row.id, name: row.name, assigned_consultant: row.assigned_consultant, updated: row.updated };
  });
  const consultants = value.consultants.map(row => {
    if (!object(row) || !text(row.id) || !text(row.name, true) || row.role !== 'consultant') throw new Error('담당자 정보를 확인하지 못했습니다.');
    return { id: row.id, name: row.name, role: 'consultant' as const };
  });
  if (new Set(students.map(row => row.id)).size !== students.length || new Set(consultants.map(row => row.id)).size !== consultants.length) throw new Error('중복된 배정 정보를 확인해 주세요.');
  return { assignmentField: 'assigned_consultant', students, consultants };
}
async function request(method: 'GET' | 'POST', payload?: Record<string, string>): Promise<unknown> {
  const captured = session();
  const response = await fetch(SUPREMA_LAB_URL + '/api/academy/assignments', {
    method, headers: { Authorization: 'Bearer ' + captured.token, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    ...(payload ? { body: JSON.stringify(payload) } : {}), cache: 'no-store', signal: AbortSignal.timeout(20_000),
  });
  currentSession(captured);
  const result: unknown = await response.json().catch(() => null);
  currentSession(captured);
  if (!response.ok) {
    const fallback = response.status === 409 ? '다른 관리자가 배정을 수정했습니다. 최신 정보를 다시 불러와 주세요.' : '학생 배정 요청을 완료하지 못했습니다.';
    throw new Error(object(result) && text(result.error) ? result.error : fallback);
  }
  return result;
}
export async function readAssignments(): Promise<AssignmentRoster> { return validateAssignmentRoster(await request('GET')); }
export async function saveAssignment(studentId: string, consultantId: string, expectedUpdated: string): Promise<void> {
  if (!text(studentId) || !text(consultantId, true) || !text(expectedUpdated)) throw new Error('학생과 담당자를 다시 확인해 주세요.');
  await request('POST', { studentId, consultantId, expectedUpdated });
}
