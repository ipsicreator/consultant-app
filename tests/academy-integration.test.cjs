const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
function load(file, mocks = {}, env = {}) {
  const filename = path.resolve(file), mod = new Module(filename, module); mod.paths = module.paths;
  const ordinary = mod.require.bind(mod); mod.require = name => Object.hasOwn(mocks, name) ? mocks[name] : ordinary(name);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8').replaceAll('import.meta.env', JSON.stringify(env)), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename); return mod.exports;
}
const scope = load('src/lib/academyScope.ts'), contract = load('src/lib/labContract.ts'), analysis = load('src/lib/analysisResult.ts');
const manager = scope.profileScope({ id: 'profile-a', user: 'user-a', academy_id: 'academy-a', role: 'admin' }, 'user-a'), consultant = { ...manager, role: 'consultant' };
test('profile ownership, explicit academy and known role are required', () => {
  for (const profile of [{ id: 'x', user: 'other', academy_id: 'a', role: 'master' }, { id: 'x', user: 'me', academy_id: '', role: 'master' }, { id: 'x', user: 'me', academy_id: 'a', role: 'student' }]) assert.throws(() => scope.profileScope(profile, 'me'));
  assert.equal(manager.academyId, 'academy-a'); assert.equal(scope.canManageAcademy(consultant), false);
});
test('managers remain academy scoped and consultants need a real assignment relation', () => {
  assert.equal(scope.studentFilter(manager), 'academy_id="academy-a"');
  assert.throws(() => scope.studentFilter(consultant), /배정/); assert.throws(() => scope.studentFilter(consultant, 'id || true'), /배정/);
  assert.equal(scope.studentFilter(consultant, 'assigned_profile'), 'academy_id="academy-a" && assigned_profile="profile-a"');
  assert.throws(() => scope.assertStudentScope({ academy_id: 'academy-b' }, manager));
  assert.throws(() => scope.assertStudentScope({ academy_id: 'academy-a', assigned_profile: 'other' }, consultant, 'assigned_profile'));
  scope.assertStudentScope({ academy_id: 'academy-a', assigned_profile: ['profile-a'] }, consultant, 'assigned_profile');
  assert.equal(scope.filterValue('a" || active=true'), JSON.stringify('a" || active=true'));
});
test('profile lookup never creates accounts or chooses another academy license', async () => {
  const calls = [], pb = { authStore: { isValid: true, model: { id: 'user-a', collectionName: 'users' } }, collection: name => { calls.push(name); return { getList: async () => ({ totalItems: 1, items: [{ id: 'profile-a', user: 'user-a', academy_id: 'academy-a', role: 'admin' }] }), create: () => { throw Error('must not create'); } }; } };
  const api = load('src/lib/profileLink.ts', { './pocketbase': { pb }, './academyScope': scope, './assignmentConfig': {STUDENT_CONSULTANT_FIELD:'assigned_consultant'} });
  assert.equal((await api.requireAcademyScope()).academyId, 'academy-a'); assert.deepEqual(calls, ['suprima_profiles']);
  pb.authStore.model.collectionName = '_superusers'; await assert.rejects(api.requireAcademyScope(), /일반 학원/);
});
test('profile permission failures cannot trigger broad fallback queries', async () => {
  let requests = 0; const pb = { authStore: { isValid: true, model: { id: 'user-a', collectionName: 'users' } }, collection: () => ({ getList: async () => { requests++; throw { status: 403 }; } }) };
  const api = load('src/lib/profileLink.ts', { './pocketbase': { pb }, './academyScope': scope, './assignmentConfig': {STUDENT_CONSULTANT_FIELD:'assigned_consultant'} }); await assert.rejects(api.requireAcademyScope()); assert.equal(requests, 1);
});
test('lab address accepts production and local tests while rejecting unsafe components', () => {
  assert.equal(contract.labBaseUrl(), 'https://suprema-lab.vercel.app'); assert.equal(contract.labBaseUrl('http://127.0.0.1:3000'), 'http://127.0.0.1:3000');
  for (const value of ['http://public.example', 'javascript:alert(1)', 'https://user:password@example.test', 'https://example.test/path', 'https://example.test/?token=abc']) assert.throws(() => contract.labBaseUrl(value));
});
test('shared admissions preserve empty data and absent numeric evidence', () => {
  assert.deepEqual(contract.sharedAdmissionRows({ success: true, rows: [] }), []); assert.throws(() => contract.sharedAdmissionRows({ success: false, rows: [] })); assert.throws(() => contract.sharedAdmissionRows({ success: true, rows: [{}] }));
  const [row] = contract.sharedAdmissionRows({ success: true, rows: [{ univ: '검증대', dept: '수학과', type: '교과', name: '일반', cutoff26: null, cutoff25: 0, cutoff24: 2.5 }] }); assert.equal(row.cutoff26, null); assert.equal(row.cutoff25, null); assert.equal(row.cutoff24, 2.5);
});
test('AI uses authenticated central bridge; rejected requests cannot become fake data', async () => {
  const pb = { authStore: { isValid: false, token: '' } }, api = load('src/lib/lab.ts', { './pocketbase': { pb }, './labContract': contract }); await assert.rejects(api.requestLabAI('exploration-topics', {}), /로그인/);
  pb.authStore.isValid = true; pb.authStore.token = 'test-session-token'; const original = global.fetch;
  try {
    let request; global.fetch = async (url, options) => { request = { url, options }; return Response.json({ summary: '실제 결과' }); };
    assert.deepEqual(await api.requestLabAI('analyze-student-text', { inputText: '원문' }), { summary: '실제 결과' }); assert.equal(request.url, 'https://suprema-lab.vercel.app/api/academy/ai'); assert.equal(request.options.headers.Authorization, 'Bearer test-session-token'); assert.equal(JSON.parse(request.options.body).operation, 'analyze-student-text'); assert.equal(request.url.includes('token'), false);
    global.fetch = async () => Response.json({ error: '사용 권한 없음' }, { status: 403 }); await assert.rejects(api.requestLabAI('analyze-student-text', {}), /사용 권한 없음/);
  } finally { global.fetch = original; }
  await assert.rejects(api.pdfPayload(new File(['text'], 'record.txt', { type: 'text/plain' })), /PDF/); await assert.rejects(api.pdfPayload(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'record.pdf', { type: 'application/pdf' })), /2MB/);
});
test('analysis does not invent scores or convert missing grades into zero', () => {
  const result = analysis.studentAnalysis({ summary: '자료 확인', gradeAnalysis: [{ subject: '수학', score: null }, { subject: '국어', score: 0 }] }); assert.equal(result.gradeAnalysis[0].score, null); assert.equal(analysis.evidenceAverage(result.gradeAnalysis), 0); assert.equal(analysis.evidenceAverage([]), null); assert.deepEqual(analysis.studentAnalysis({ summary: '자료 없음' }).gradeAnalysis, []); assert.throws(() => analysis.studentAnalysis({}));
});

test('only the canonical user relation grants a unique academy profile; creator text cannot authenticate', async () => {
  const profile = { id: 'profile-a', user: 'user-a', admin_id: 'shared-creator', academy_id: 'academy-a', role: 'admin' };
  let mode = 'duplicate', requests = 0;
  const pb = { authStore: { isValid: true, model: { id: 'user-a', collectionName: 'users' } }, collection: () => ({ getList: async (_page, _size, options) => {
    requests++; assert.equal(options.filter, 'user="user-a"');
    if (mode === 'duplicate') return { totalItems: 2, items: [profile, {...profile,id:'profile-b'}] };
    if (mode === 'missing') throw {status:400};
    if (mode === 'creator-only') return { totalItems:1, items:[{...profile,user:'someone-else',admin_id:'user-a'}] };
    return { totalItems:1,items:[profile] };
  } }) };
  const api = load('src/lib/profileLink.ts', { './pocketbase': { pb }, './academyScope': scope, './assignmentConfig': {STUDENT_CONSULTANT_FIELD:'assigned_consultant'} });
  await assert.rejects(api.requireAcademyScope(), /하나로/);
  mode='valid'; assert.equal((await api.requireAcademyScope()).profileId,'profile-a');
  mode='creator-only'; await assert.rejects(api.requireAcademyScope(), /일치/);
  mode='missing'; requests=0; await assert.rejects(api.requireAcademyScope()); assert.equal(requests,1);
  assert.throws(()=>scope.profileScope({...profile,user:undefined,admin_id:'user-a'},'user-a'),/일치/);
});

test('student history authorizes before querying and validates every returned owner', async () => {
  const events = [], pb = { authStore: { isValid: true, model: { id: 'user-a', collectionName: 'users' } }, collection: () => ({ getFullList: async options => { events.push('read'); assert.equal(options.filter, 'student_id="student-a"'); return [{ id: 'record-b', student_id: 'student-b' }]; } }) };
  let denied = true;
  const api = load('src/lib/studentRecords.ts', { './pocketbase': { pb }, './profileLink': { requireStudentAccess: async () => { events.push('authorize'); if (denied) throw Error('denied'); } }, './academyScope': scope, './assignmentConfig': {STUDENT_CONSULTANT_FIELD:'assigned_consultant'} });
  await assert.rejects(api.studentRecords('student-a').getFullList(), /denied/); assert.deepEqual(events, ['authorize']);
  denied = false; events.length = 0; await assert.rejects(api.studentRecords('student-a').getFullList(), /선택한 학생/); assert.deepEqual(events, ['authorize', 'read']);
});

test('cross-student history update and deletion are rejected before mutation', async () => {
  let writes = 0;
  const pb = { authStore: { isValid: true, model: { id: 'user-a', collectionName: 'users' } }, collection: () => ({ getOne: async () => ({ id: 'record-b', student_id: 'student-b' }), update: async () => writes++, delete: async () => writes++ }) };
  const api = load('src/lib/studentRecords.ts', { './pocketbase': { pb }, './profileLink': { requireStudentAccess: async () => {} }, './academyScope': scope, './assignmentConfig': {STUDENT_CONSULTANT_FIELD:'assigned_consultant'} });
  await assert.rejects(api.studentRecords('student-a').update('record-b', { content: {} }), /선택한 학생/); await assert.rejects(api.studentRecords('student-a').delete('record-b'), /선택한 학생/); assert.equal(writes, 0);
});

test('account switches invalidate in-flight student reads and cache keys stay per user', async () => {
  const pb = { authStore: { isValid: true, model: { id: 'user-a', collectionName: 'users' } }, collection: () => ({ getFullList: async () => { pb.authStore.model.id = 'user-b'; return [{ student_id: 'student-a' }]; } }) };
  const api = load('src/lib/studentRecords.ts', { './pocketbase': { pb }, './profileLink': { requireStudentAccess: async () => {} }, './academyScope': scope, './assignmentConfig': {STUDENT_CONSULTANT_FIELD:'assigned_consultant'} });
  await assert.rejects(api.studentRecords('student-a').getFullList(), /계정이 변경/); assert.notEqual(scope.draftStorageKey('user-a', 'student-a'), scope.draftStorageKey('user-b', 'student-a'));
});

test('local drafts cannot be read before student authorization', async () => {
  const original = global.localStorage; let reads = 0;
  global.localStorage = { getItem: () => { reads++; return '{}'; } };
  try { const pb = { authStore: { isValid: true, model: { id: 'user-a', collectionName: 'users' } } }, api = load('src/lib/studentRecords.ts', { './pocketbase': { pb }, './profileLink': { requireStudentAccess: async () => { throw Error('denied'); } }, './academyScope': scope, './assignmentConfig': {STUDENT_CONSULTANT_FIELD:'assigned_consultant'} }); await assert.rejects(api.readStudentDraft('student-a'), /denied/); assert.equal(reads, 0); } finally { global.localStorage = original; }
});

test('admission decisions preserve exact lab identity and held judgement', async () => {
  const api = load('src/lib/lab.ts', { './pocketbase': { pb: { authStore: {} } }, './labContract': contract }), original = global.fetch;
  try { global.fetch = async (url, options) => { assert.equal(url, 'https://suprema-lab.vercel.app/api/diagnosis'); const body = JSON.parse(options.body); assert.deepEqual(body, { studentIndex: 2.5, gradingSystem: '9-level', choices: [{ university: '대학(캠퍼스)', department: '수학과', admission_type: '교과', track_name: '일반전형' }] }); return Response.json({ results: [{ level: '판단 보류', comment: '명시적인 비교 근거 없음' }] }); }; assert.deepEqual(await api.requestAdmissionDiagnosis(2.5, '9-level', { univ: '대학(캠퍼스)', dept: '수학과', type: '교과', name: '일반전형' }), { level: '판단 보류', reason: '명시적인 비교 근거 없음' }); } finally { global.fetch = original; }
});

test('master profile in consultant app has full access across manager and consultant actions', () => {
  const masterScope = scope.profileScope({ id: 'profile-master', user: 'master-user', academy_id: 'academy-a', role: 'master' }, 'master-user');
  assert.equal(masterScope.role, 'master');
  assert.equal(scope.canManageAcademy(masterScope), true);
  assert.equal(scope.canManageAcademy({ ...manager, role: 'master' }), true);
  assert.equal(scope.canManageAcademy({ ...manager, role: 'admin' }), true);
  assert.equal(scope.canManageAcademy({ ...manager, role: 'consultant' }), false);
});
