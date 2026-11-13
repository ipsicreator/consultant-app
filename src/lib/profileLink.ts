import { pb } from './pocketbase';
import { assertStudentScope, filterValue, profileScope, studentFilter } from './academyScope';
// Resolving a linked profile never creates or assigns one.
export async function resolveOrCreateProfile() {
  if (!pb.authStore.isValid || !pb.authStore.model?.id) throw new Error('다시 로그인해 주세요.');
  if (pb.authStore.model.collectionName !== 'users') throw new Error('일반 학원 사용자 계정으로 로그인해 주세요.');
  const userId = pb.authStore.model.id;
  let matches;
  try { matches = await pb.collection('suprima_profiles').getList(1, 2, { filter: '(admin_id=' + filterValue(userId) + ' || user=' + filterValue(userId) + ')' }); }
  catch (error) {
    if (![400, 404].includes((error as { status?: number }).status || 0)) throw error;
    const readLegacyLink = async (field: string) => {
      try { return await pb.collection('suprima_profiles').getList(1, 2, { filter: field + '=' + filterValue(userId) }); }
      catch (reason) { if ([400, 404].includes((reason as { status?: number }).status || 0)) return { totalItems: 0, items: [] }; throw reason; }
    };
    const results = await Promise.all([readLegacyLink('admin_id'), readLegacyLink('user')]);
    if (results.some(result => result.totalItems > 1)) throw new Error('본인에게 연결된 학원 프로필을 하나로 확인해 주세요.');
    const profiles = new Map(results.flatMap(result => result.items).map(profile => [profile.id, profile]));
    matches = { totalItems: profiles.size, items: [...profiles.values()] };
  }
  if (matches.items.length !== 1 || matches.totalItems !== 1) throw new Error('본인에게 연결된 학원 프로필을 하나로 확인해 주세요.');
  const profile = matches.items[0];
  profileScope(profile, userId);
  return profile;
}
export async function requireAcademyScope() { return profileScope(await resolveOrCreateProfile(), pb.authStore.model?.id || ''); }
export async function scopedStudents() {
  const scope = await requireAcademyScope();
  const records = await pb.collection('suprima_students').getFullList({ filter: studentFilter(scope, import.meta.env.VITE_STUDENT_CONSULTANT_FIELD), sort: '-created' });
  records.forEach(record => assertStudentScope(record, scope, import.meta.env.VITE_STUDENT_CONSULTANT_FIELD));
  return records;
}
export async function requireStudentAccess(id: string) {
  const scope = await requireAcademyScope(); studentFilter(scope, import.meta.env.VITE_STUDENT_CONSULTANT_FIELD);
  const student = await pb.collection('suprima_students').getOne(id);
  assertStudentScope(student, scope, import.meta.env.VITE_STUDENT_CONSULTANT_FIELD); return scope;
}
