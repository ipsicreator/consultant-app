# set_master_role_direct.ps1
$adminEmail = "chrisklee69@gmail.com"
$adminPass = "aussie1996@@"
$pbUrl = "https://suprima-platform-pb.fly.dev"

# 1️⃣ 로그인 (admin endpoint)
$login = Invoke-RestMethod -Method POST -Uri "$pbUrl/api/admins/auth-with-password" -Headers @{"Content-Type"="application/json"} -Body (@{identity=$adminEmail; password=$adminPass} | ConvertTo-Json)
$token = $login.token

# 2️⃣ 프로필 ID 조회
$filter = "email='chrisklee69@gmail.com'"
$uri = "$pbUrl/api/collections/suprima_profiles/records?filter=$([System.Web.HttpUtility]::UrlEncode($filter))"
$profileResp = Invoke-RestMethod -Method GET -Uri $uri -Headers @{Authorization="Bearer $token"}
$profile = $profileResp.items[0]
$profileId = $profile.id
Write-Host "Found profile ID: $profileId (current role: $($profile.role))"

# 3️⃣ role을 master 로 업데이트
$patch = Invoke-RestMethod -Method PATCH -Uri "$pbUrl/api/collections/suprima_profiles/records/$profileId" -Headers @{Authorization="Bearer $token"} -Body (@{role="master"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "✅ Updated role to master for profile ID $profileId"
