import { pb } from './pocketbase';
import { requireStudentAccess } from './profileLink';
import { assertAnalysisOwner, draftStorageKey, filterValue } from './academyScope';

export function sessionIdentity(): string { return pb.authStore.isValid && pb.authStore.model?.collectionName === 'users' ? pb.authStore.model.id : ''; }
function assertIdentity(userId: string): void { if (!userId || sessionIdentity() !== userId) throw new Error('로그인 계정이 변경되었습니다. 다시 확인해 주세요.'); }

export async function readStudentDraft(studentId: string): Promise<Record<string, string>> {
  const userId = sessionIdentity(); await requireStudentAccess(studentId); assertIdentity(userId);
  try {
    const value: unknown = JSON.parse(localStorage.getItem(draftStorageKey(userId, studentId)) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([key, item]) => ['hopeMajor', 'gpa', 'activities'].includes(key) && typeof item === 'string')) as Record<string, string>;
  } catch { return {}; }
}

export function studentRecords(studentId: string | undefined) {
  const authorize = async () => { if (!studentId) throw new Error('학생을 먼저 선택해 주세요.'); const userId = sessionIdentity(); await requireStudentAccess(studentId); assertIdentity(userId); return userId; };
  const records = pb.collection('suprima_pdf_analyses');
  return {
    async getFullList(_options?: unknown) {
      const userId = await authorize();
      const rows = await records.getFullList({ filter: 'student_id=' + filterValue(studentId!), sort: '-created' });
      assertIdentity(userId); rows.forEach(row => assertAnalysisOwner(row, studentId!)); return rows;
    },
    async create(data: Record<string, unknown>) {
      const userId = await authorize(); assertAnalysisOwner(data, studentId!); assertIdentity(userId);
      return records.create(data);
    },
    async update(id: string, data: Record<string, unknown>) {
      const userId = await authorize(); const existing = await records.getOne(id); assertIdentity(userId); assertAnalysisOwner(existing, studentId!);
      if (Object.hasOwn(data, 'student_id')) assertAnalysisOwner(data, studentId!);
      return records.update(id, data);
    },
    async delete(id: string) {
      const userId = await authorize(); const existing = await records.getOne(id); assertIdentity(userId); assertAnalysisOwner(existing, studentId!);
      return records.delete(id);
    },
  };
}
