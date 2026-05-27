# set_master_role_final.ps1
# Admin credentials (provided by user)
$adminEmail = "chrisklee69@gmail.com"
$adminPass  = "aussie1996@@"
$pbUrl = "https://suprima-platform-pb.fly.dev"

# 1️⃣ Admin login → get token
$login = Invoke-RestMethod -Method Post -Uri "$pbUrl/api/admins/auth-with-password" -Body (@{identity=$adminEmail; password=$adminPass} | ConvertTo-Json) -ContentType "application/json"
$token = $login.token
Write-Host "✅ Admin token acquired"

# 2️⃣ Find profile record by email (URL‑encoded filter)
$filter = "email='chrisklee69@gmail.com'"
$encFilter = [System.Net.WebUtility]::UrlEncode($filter)
$profileResp = Invoke-RestMethod -Method Get -Uri "$pbUrl/api/collections/suprima_profiles/records?filter=$encFilter" -Headers @{Authorization = "Bearer $token"}
if ($profileResp.items.Count -eq 0) { Write-Error "Profile not found"; exit 1 }
$profileId = $profileResp.items[0].id
$currRole = $profileResp.items[0].role
Write-Host "🔎 Found profile ID $profileId (current role: $currRole)"

# 3️⃣ Update role to master
Invoke-RestMethod -Method Patch -Uri "$pbUrl/api/collections/suprima_profiles/records/$profileId" -Headers @{Authorization = "Bearer $token"} -Body (@{role='master'} | ConvertTo-Json) -ContentType "application/json"
Write-Host "✅ Role updated to master"

# 4️⃣ Verify
$verify = Invoke-RestMethod -Method Get -Uri "$pbUrl/api/collections/suprima_profiles/records/$profileId" -Headers @{Authorization = "Bearer $token"}
Write-Host "🔎 After update role: $($verify.role)"
