// fix_verified.cjs — 마스터 계정의 verified를 true로 강제 설정

const PB_URL = "https://suprima-platform-pb.fly.dev";
const ADMIN_EMAIL = "chrisklee69@gmail.com";
const ADMIN_PASSWORD = "aussie1996@@";
const USER_ID = "wdlcklse76604zc";

async function fix() {
  // Admin 로그인
  const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  if (!authRes.ok) throw new Error("Admin login failed");
  const { token } = await authRes.json();

  // verified = true 로 업데이트
  const res = await fetch(`${PB_URL}/api/collections/users/records/${USER_ID}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ verified: true })
  });

  if (res.ok) {
    console.log("✅  verified = true 로 업데이트 완료!");
  } else {
    console.error("❌  실패:", await res.text());
  }
}

fix();
