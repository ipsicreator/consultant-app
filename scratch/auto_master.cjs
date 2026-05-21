// auto_master.cjs
// 마스터(이기욱) 계정·프로필·라이선스를 안전하게 보장하는 스크립트
// 이미 존재하면 스킵 → DB 삭제 불필요

const PB_URL = "https://suprima-platform-pb.fly.dev";
const MASTER_EMAIL = "chrisklee69@gmail.com";
const ADMIN_PASSWORD = "aussie1996@@";    // PocketBase 관리자 비밀번호 (@ 2개)
const USER_PASSWORD  = "aussie1996@@@";   // 앱 로그인 비밀번호 (@ 3개)
const MASTER_NAME = "이기욱";

const headers = (token) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
});

// ── Admin 로그인 ──
async function adminLogin() {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: MASTER_EMAIL, password: ADMIN_PASSWORD })
  });
  if (!res.ok) throw new Error("Admin login failed: " + (await res.text()));
  return (await res.json()).token;
}

// ── 전체 레코드 조회 후 JS에서 필터링 (필터 API 오류 우회) ──
async function getAllRecords(token, collection) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch ${collection}: ${await res.text()}`);
  return (await res.json()).items || [];
}

// ── 1) users 컬렉션에 마스터 계정 보장 ──
async function ensureUser(token) {
  const allUsers = await getAllRecords(token, "users");
  const existing = allUsers.find(u => u.email === MASTER_EMAIL);

  if (existing) {
    console.log(`✅  User exists → id=${existing.id}`);
    return existing.id;
  }

  console.log("🆕  Creating user...");
  const res = await fetch(`${PB_URL}/api/collections/users/records`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      email: MASTER_EMAIL,
      password: USER_PASSWORD,
      passwordConfirm: USER_PASSWORD,
      emailVisibility: true,
      verified: true
    })
  });
  if (!res.ok) throw new Error("User creation failed: " + (await res.text()));
  const user = await res.json();
  console.log(`✅  User created → id=${user.id}`);
  return user.id;
}

// ── 2) suprima_profiles 컬렉션에 admin 프로필 보장 ──
async function ensureProfile(token, userId) {
  const allProfiles = await getAllRecords(token, "suprima_profiles");
  const existing = allProfiles.find(p => p.email === MASTER_EMAIL);

  if (!existing) {
    console.log("🆕  Creating admin profile...");
    const res = await fetch(`${PB_URL}/api/collections/suprima_profiles/records`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        email: MASTER_EMAIL,
        name: MASTER_NAME,
        role: "master",
        academy_id: "suprema_main",
        user: userId
      })
    });
    if (!res.ok) throw new Error("Profile creation failed: " + (await res.text()));
    const profile = await res.json();
    console.log(`✅  Profile created → id=${profile.id} (role=admin)`);
  } else if (existing.role !== "master") {
    console.log("🔧  Updating profile role to admin...");
    const res = await fetch(`${PB_URL}/api/collections/suprima_profiles/records/${existing.id}`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ role: "master" })
    });
    if (!res.ok) throw new Error("Profile update failed: " + (await res.text()));
    console.log(`✅  Profile role updated to admin → id=${existing.id}`);
  } else {
    console.log(`✅  Profile exists (role=admin) → id=${existing.id}`);
  }
}

// ── 3) suprima_licenses 컬렉션에 활성 라이선스 보장 ──
async function ensureLicense(token) {
  const allLicenses = await getAllRecords(token, "suprima_licenses");
  const existing = allLicenses.find(l => l.email === MASTER_EMAIL);

  if (!existing) {
    console.log("🆕  Creating license...");
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 5);
    const res = await fetch(`${PB_URL}/api/collections/suprima_licenses/records`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        email: MASTER_EMAIL,
        academy_id: "suprema_main",
        expires_at: exp.toISOString(),
        active: true
      })
    });
    if (!res.ok) throw new Error("License creation failed: " + (await res.text()));
    console.log("✅  License created (active, 5yr)");
  } else {
    console.log("✅  License exists");
  }
}

// ── 실행 ──
(async () => {
  try {
    console.log("── 마스터(이기욱) 초기화 시작 ──\n");
    const token = await adminLogin();
    console.log("✅  Admin login OK\n");

    const userId = await ensureUser(token);
    await ensureProfile(token, userId);
    await ensureLicense(token);

    console.log("\n🚀  완료!");
    console.log(`   이메일   → ${MASTER_EMAIL}`);
    console.log(`   비밀번호 → ${USER_PASSWORD}`);
  } catch (e) {
    console.error("\n❌  실패:", e.message);
    process.exit(1);
  }
})();
