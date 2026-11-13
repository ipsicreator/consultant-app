export type AcademyRole = 'master' | 'admin' | 'consultant';
export type AcademyScope = { userId: string; profileId: string; academyId: string; role: AcademyRole; name: string };

export function filterValue(value: string): string { return JSON.stringify(value); }

export function profileScope(value: unknown, userId: string): AcademyScope {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !userId) throw new Error('학원 계정 연결을 확인해 주세요.');
  const profile = value as Record<string, unknown>;
  const linked = profile.user === userId;
  if (!linked) throw new Error('로그인 계정과 학원 프로필이 일치하지 않습니다.');
  if (!['master', 'admin', 'consultant'].includes(String(profile.role))) throw new Error('허용된 학원 역할이 없습니다.');
  if (typeof profile.academy_id !== 'string' || !profile.academy_id.trim() || typeof profile.id !== 'string') throw new Error('학원 소속을 관리자가 설정해야 합니다.');
  return { userId, profileId: profile.id, academyId: profile.academy_id.trim(), role: profile.role as AcademyRole, name: typeof profile.name === 'string' ? profile.name : typeof profile.full_name === 'string' ? profile.full_name : '' };
}

export function draftStorageKey(userId: string, studentId: string): string {
  if (!userId || !studentId) throw new Error('계정과 학생을 먼저 확인해 주세요.');
  return 'student_info:' + encodeURIComponent(userId) + ':' + encodeURIComponent(studentId);
}

export function assertAnalysisOwner(record: Record<string, unknown>, studentId: string): void {
  if (!studentId || record.student_id !== studentId) throw new Error('선택한 학생의 기록이 아닙니다.');
}

export function canManageAcademy(scope: AcademyScope): boolean { return scope.role === 'master' || scope.role === 'admin'; }

export function studentFilter(scope: AcademyScope, assignmentField?: string): string {
  const academy = 'academy_id=' + filterValue(scope.academyId);
  if (canManageAcademy(scope)) return academy;
  if (!assignmentField || !/^[a-z][a-z0-9_]*$/i.test(assignmentField)) throw new Error('담당 학생 배정 설정이 필요합니다. 학원 관리자에게 문의해 주세요.');
  return academy + ' && ' + assignmentField + '=' + filterValue(scope.profileId);
}

export function assertStudentScope(record: Record<string, unknown>, scope: AcademyScope, assignmentField?: string): void {
  if (record.academy_id !== scope.academyId) throw new Error('다른 학원의 학생 자료에 접근할 수 없습니다.');
  if (!canManageAcademy(scope)) {
    studentFilter(scope, assignmentField);
    const assigned = record[assignmentField!];
    if (assigned !== scope.profileId && !(Array.isArray(assigned) && assigned.includes(scope.profileId))) throw new Error('배정된 학생만 확인할 수 있습니다.');
  }
}
