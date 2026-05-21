// test_login.cjs — 앱 로그인과 동일한 방식으로 users 컬렉션 인증 테스트

const PB_URL = "https://suprima-platform-pb.fly.dev";
const EMAIL = "chrisklee69@gmail.com";
const PASSWORD = "aussie1996@@@";

async function testLogin() {
  console.log(`Testing app login: ${EMAIL} / ${PASSWORD}\n`);

  const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD })
  });

  if (res.ok) {
    const data = await res.json();
    console.log("✅  로그인 성공!");
    console.log(`   User ID: ${data.record.id}`);
    console.log(`   Email: ${data.record.email}`);
    console.log(`   Verified: ${data.record.verified}`);
  } else {
    const err = await res.text();
    console.error("❌  로그인 실패:", err);

    // 비밀번호 @@ (2개)로도 시도
    console.log("\n@@ (2개) 비밀번호로 재시도...");
    const res2 = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: EMAIL, password: "aussie1996@@" })
    });
    if (res2.ok) {
      console.log("✅  @@ (2개) 비밀번호로 로그인 성공! → 앱 비밀번호가 @@입니다");
    } else {
      console.error("❌  @@ (2개)도 실패:", await res2.text());
    }
  }
}

testLogin();
