// reset_password.cjs — 마스터 비밀번호를 간단하게 재설정

const PB_URL = "https://suprima-platform-pb.fly.dev";
const ADMIN_EMAIL = "chrisklee69@gmail.com";
const ADMIN_PW = "aussie1996@@";  // PB admin 비밀번호
const USER_ID = "wdlcklse76604zc";
const NEW_PASSWORD = "suprima2026!";  // 새 앱 로그인 비밀번호

async function reset() {
  const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PW })
  });
  if (!authRes.ok) throw new Error("Admin login failed");
  const { token } = await authRes.json();

  const res = await fetch(`${PB_URL}/api/collections/users/records/${USER_ID}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      password: NEW_PASSWORD,
      passwordConfirm: NEW_PASSWORD
    })
  });

  if (res.ok) {
    console.log("✅  비밀번호 변경 완료!");
    console.log(`   이메일:   ${ADMIN_EMAIL}`);
    console.log(`   새 비밀번호: ${NEW_PASSWORD}`);
  } else {
    console.error("❌  실패:", await res.text());
  }

  // 변경된 비밀번호로 로그인 테스트
  console.log("\n로그인 테스트...");
  const loginRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: NEW_PASSWORD })
  });
  if (loginRes.ok) {
    console.log("✅  새 비밀번호로 로그인 성공!");
  } else {
    console.error("❌  로그인 실패:", await loginRes.text());
  }
}

reset();
