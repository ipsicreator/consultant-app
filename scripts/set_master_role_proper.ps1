# set_master_role_proper.ps1
$adminEmail = "chrisklee69@gmail.com"
$adminPass = "aussie1996@@"
$pbUrl = "https://suprima-platform-pb.fly.dev"

# 1️⃣ Admin login → 토큰 획득
$login = Invoke-RestMethod -Method Post -Uri "$pbUrl/api/admins/auth-with-password" -Headers @{"Content-Type"="application/json"} -Body (@{identity=$adminEmail; password=$adminPass} | ConvertTo-Json)
$token = $login.token
Write-Host "✅ Admin token obtained"

# 2️⃣ 프로필 조회 (필터 사용)
$filter = "email='chrisklee69@gmail.com'"
$uri = "$pbUrl/api/collections/suprima_profiles/records?filter=$([System.Web.HttpUtility]::UrlEncode($filter))"
$profileResp = Invoke-RestMethod -Method Get -Uri $uri -Headers @{Authorization = "Bearer $token"}
if ($profileResp.items.Count -eq 0) { Write-Error "Profile not found"; exit 1 }
$profile = $profileResp.items[0]
$profileId = $profile.id
Write-Host "🔎 Found profile ID $profileId (current role: $($profile.role))"

# 3️⃣ role을 master 로 업데이트
Invoke-RestMethod -Method Patch -Uri "$pbUrl/api/collections/suprima_profiles/records/$profileId" -Headers @{Authorization = "Bearer $token"} -Body (@{role='master'} | ConvertTo-Json) -Content-Type "application/json"
Write-Host "✅ role updated to master"

# 4️⃣ 업데이트 확인
$updated = Invoke-RestMethod -Method Get -Uri "$pbUrl/api/collections/suprima_profiles/records/$profileId" -Headers @{Authorization = "Bearer $token"}
Write-Host "🔎 After update role: $($updated.role)"
