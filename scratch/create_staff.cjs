// create_staff.cjs
// 실무자(컨설턴트/스태프) 계정·프로필·라이선스 신규 생성 스크립트
// 사용법: node scratch/create_staff.cjs <이메일> <이름>
// 예: node scratch/create_staff.cjs staff1@example.com "김교사"

const PB_URL = "https://suprima-platform-pb.fly.dev";
const ADMIN_EMAIL = "chrisklee69@gmail.com";
const ADMIN_PASSWORD = "aussie1996@@"; // PocketBase 관리자 비밀번호
const DEFAULT_STAFF_PASSWORD = "staffdefault@@@"; // 생성될 스태프의 앱 로그인 초기 비밀번호

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("❌ 사용법: node scratch/create_staff.cjs <이메일> <이름>");
  console.log("예: node scratch/create_staff.cjs staff1@example.com \"김교사\"");
  process.exit(1);
}

const STAFF_EMAIL = args[0].trim();
const STAFF_NAME = args[1].trim();

const headers = (token) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
});

// ── Admin 로그인 ──
async function adminLogin() {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
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

// ── 실행 ──
(async () => {
  try {
    console.log(`── 실무자(${STAFF_NAME}) 등록 시작 ──\n`);
    const token = await adminLogin();
    console.log("✅  Admin 로그인 성공\n");

    // 1) users 컬렉션에 계정 생성
    const allUsers = await getAllRecords(token, "users");
    let userId = allUsers.find(u => u.email === STAFF_EMAIL)?.id;

    if (!userId) {
      console.log(`🆕  Creating user (${STAFF_EMAIL})...`);
      const res = await fetch(`${PB_URL}/api/collections/users/records`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          email: STAFF_EMAIL,
          password: DEFAULT_STAFF_PASSWORD,
          passwordConfirm: DEFAULT_STAFF_PASSWORD,
          emailVisibility: true,
          verified: true
        })
      });
      if (!res.ok) throw new Error("User creation failed: " + (await res.text()));
      const user = await res.json();
      userId = user.id;
      console.log(`✅  User created → id=${userId}`);
    } else {
      console.log(`✅  User already exists → id=${userId}`);
    }

    // 2) suprima_profiles 컬렉션에 프로필 생성
    const allProfiles = await getAllRecords(token, "suprima_profiles");
    const existingProfile = allProfiles.find(p => p.email === STAFF_EMAIL);

    if (!existingProfile) {
      console.log("🆕  Creating staff profile...");
      const res = await fetch(`${PB_URL}/api/collections/suprima_profiles/records`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          email: STAFF_EMAIL,
          name: STAFF_NAME,
          role: "staff",
          academy_id: "suprema_main",
          user: userId
        })
      });
      if (!res.ok) throw new Error("Profile creation failed: " + (await res.text()));
      const profile = await res.json();
      console.log(`✅  Profile created → id=${profile.id} (role=staff)`);
    } else {
      console.log(`✅  Profile already exists → id=${existingProfile.id} (role=${existingProfile.role})`);
    }

    // 3) suprima_licenses 컬렉션에 라이선스 생성
    const allLicenses = await getAllRecords(token, "suprima_licenses");
    const existingLicense = allLicenses.find(l => l.email === STAFF_EMAIL);

    if (!existingLicense) {
      console.log("🆕  Creating license...");
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 2); // 2년 유효 라이선스
      const res = await fetch(`${PB_URL}/api/collections/suprima_licenses/records`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          email: STAFF_EMAIL,
          academy_id: "suprema_main",
          expires_at: exp.toISOString(),
          active: true
        })
      });
      if (!res.ok) throw new Error("License creation failed: " + (await res.text()));
      console.log("✅  License created (active, 2yr)");
    } else {
      console.log("✅  License already exists");
    }

    console.log("\n🚀  실무자 등록 완료!");
    console.log(`   이메일   → ${STAFF_EMAIL}`);
    console.log(`   비밀번호 → ${DEFAULT_STAFF_PASSWORD}`);
  } catch (e) {
    console.error("\n❌  실패:", e.message);
    process.exit(1);
  }
})();
