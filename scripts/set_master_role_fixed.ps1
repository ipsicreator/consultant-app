# set_master_role_fixed.ps1
# PocketBase admin credentials (provided by user)
$adminEmail = "chrisklee69@gmail.com"
$adminPass  = "aussie1996@@"
$targetEmail = "chrisklee69@gmail.com"
$pbUrl = "https://suprima-platform-pb.fly.dev"

# 1. 관리자 로그인 – 토큰 획득 (admin endpoint)
$loginResp = Invoke-RestMethod -Method Post -Uri "$pbUrl/api/admins/auth-with-password" -Body (@{email=$adminEmail; password=$adminPass} | ConvertTo-Json) -ContentType "application/json"
$token = $loginResp.token

# 2. 대상 사용자 ID 조회 (suprima_profiles 컬렉션)
# URL 인코딩된 필터 문자열 사용
$filter = "email='${targetEmail}'"
$userResp = Invoke-RestMethod -Method Get -Uri "$pbUrl/api/collections/suprima_profiles/records?filter=$([System.Web.HttpUtility]::UrlEncode($filter))" -Headers @{Authorization = "Bearer $token"}
$userId = $userResp.items[0].id

# 3. role을 master 로 업데이트
Invoke-RestMethod -Method Patch -Uri "$pbUrl/api/collections/suprima_profiles/records/$userId" -Headers @{Authorization = "Bearer $token"} -Body (@{role='master'} | ConvertTo-Json) -ContentType "application/json"

Write-Host "✅ 사용자 $targetEmail (ID: $userId) 의 role을 master 로 변경했습니다."
