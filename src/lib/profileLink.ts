import { pb } from './pocketbase';

type AnyRec = Record<string, any>;

const normalizeAcademyId = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const pickFallbackAcademyId = async (): Promise<string> => {
  const licenses = await pb
    .collection('suprima_licenses')
    .getFullList({ filter: 'active=true', sort: '-updated,-created' })
    .catch(() => []);

  const preferred = (licenses as AnyRec[]).find((l) => normalizeAcademyId(l.academy_id));
  return normalizeAcademyId((preferred ?? (licenses as AnyRec[])[0] ?? {}).academy_id);
};

export const resolveOrCreateProfile = async (): Promise<AnyRec | null> => {
  if (!pb.authStore.isValid || !pb.authStore.model) return null;
  const user = pb.authStore.model as AnyRec;
  const userId = String(user.id ?? '');
  const isPocketBaseRecordId = /^[a-z0-9]{15}$/.test(userId);

  // Query by admin_id first because user is often a relation field.
  // Invalid relation filter formats can produce noisy 400 responses.
  let linked =
    (await pb.collection('suprima_profiles').getFirstListItem(`admin_id="${userId}"`).catch(() => null));

  if (!linked && isPocketBaseRecordId) {
    linked = await pb.collection('suprima_profiles').getFirstListItem(`user="${userId}"`).catch(() => null);
  }

  if (linked) {
    if (!linked.user && isPocketBaseRecordId) {
      await pb.collection('suprima_profiles').update(linked.id, { user: userId }).catch(() => {});
    }
    return linked;
  }

  const academyId = await pickFallbackAcademyId();
  const created = await pb.collection('suprima_profiles').create({
    user: isPocketBaseRecordId ? userId : undefined,
    admin_id: userId,
    name: user.name || (user.email ? String(user.email).split('@')[0] : 'consultant'),
    full_name: user.name || (user.email ? String(user.email).split('@')[0] : 'consultant'),
    role: 'consultant',
    academy_id: academyId,
  }).catch(() => null);

  return created as AnyRec | null;
};
