# set_master_role_ps.ps1
# PocketBase admin credentials
$adminEmail = "chrisklee69@gmail.com"
$adminPass = "aussie1996@@"
$targetEmail = "chrisklee69@gmail.com"
$pbUrl = "https://suprima-platform-pb.fly.dev"

# 1. 로그인하여 토큰 획득
$loginResp = Invoke-RestMethod -Method POST \
    -Uri "$pbUrl/api/collections/users/auth-with-password" \
    -Body (@{email=$adminEmail; password=$adminPass} | ConvertTo-Json) \
    -ContentType "application/json"
$token = $loginResp.token

# 2. 대상 사용자 ID 조회
$userResp = Invoke-RestMethod -Method GET \
    -Uri "$pbUrl/api/collections/suprima_profiles/records?filter=email='$targetEmail'" \
    -Headers @{ Authorization = "Bearer $token" }
$userId = $userResp.items[0].id

# 3. role을 master 로 업데이트
Invoke-RestMethod -Method PATCH \
    -Uri "$pbUrl/api/collections/suprima_profiles/records/$userId" \
    -Headers @{ Authorization = "Bearer $token" } \
    -Body (@{role="master"} | ConvertTo-Json) \
    -ContentType "application/json"

Write-Host "✅ 사용자 $targetEmail (ID: $userId) 의 역할을 master 로 변경했습니다."
